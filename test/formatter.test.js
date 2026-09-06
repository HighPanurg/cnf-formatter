const assert = require("node:assert/strict");
const test = require("node:test");
const {
  loadExtension,
  document,
  formatOptions,
  lintOptions,
} = require("./helpers");
const { parseLine, formatText, lintDocument } = loadExtension();

test("include formatting preserves spaces inside paths", () => {
  for (const directive of ["!include", "!includedir"]) {
    for (const path of [
      "/etc/mysql/team  configs.cnf",
      '"/etc/mysql/team  configs.cnf"',
    ]) {
      assert.equal(
        formatText(`${directive}   ${path}`, formatOptions),
        `${directive} ${path}\n`,
      );
    }
  }
});

test("brackets in option values are not malformed section headers", () => {
  for (const value of ["\"SELECT ']'\"", "/tmp/[mysql]/socket", '"[value]"']) {
    const parsed = parseLine(`init-connect=${value}`);
    assert.equal(parsed.type, "option");
    assert.equal(parsed.value, value);
  }
  for (const line of ["[mysqld", "mysqld]", "bad]key=value"]) {
    assert.equal(parseLine(line).type, "unknown");
  }
});

test("quote escaping depends on backslash parity", () => {
  for (const quote of ["'", '"']) {
    for (const count of [0, 1, 2, 3, 4]) {
      const value = `${quote}path${"\\".repeat(count)}${quote}`;
      const parsed = parseLine(`socket=${value} # comment`);
      assert.equal(parsed.comment, count % 2 === 0 ? "# comment" : "");
    }
  }
  assert.equal(
    parseLine("init-connect=\"SELECT '#;='\" # note").value,
    "\"SELECT '#;='\"",
  );
});

test("formatting is idempotent and preserves CRLF and option values", () => {
  for (const newline of ["\n", "\r\n"]) {
    const input = [
      "[mysqld]",
      "port=3306",
      "",
      "# comment",
      'socket="/tmp/a  b]"',
      "!include /etc/my  sql.cnf",
      "",
    ].join(newline);
    for (const alignEquals of [true, false]) {
      for (const finalNewline of [true, false]) {
        const options = { ...formatOptions, alignEquals, finalNewline };
        const formatted = formatText(input, options);
        assert.equal(formatText(formatted, options), formatted);
        assert.ok(formatted.includes('"/tmp/a  b]"'));
        if (newline === "\r\n")
          assert.ok(!formatted.replaceAll("\r\n", "").includes("\n"));
      }
    }
  }
});

test("duplicate detection canonicalizes loose prefixes and underscore spellings", () => {
  for (const names of [
    ["loose-plugin-load-add", "loose-plugin-load-add"],
    ["plugin-load-add", "loose_plugin_load_add"],
    ["loose_plugin_load_add", "plugin_load_add"],
  ]) {
    const diagnostics = lintDocument(
      document(`[mysqld]\n${names[0]}=a\n[mysqld]\n${names[1]}=b`),
      lintOptions,
    );
    assert.equal(
      diagnostics.filter((item) => item.code === "duplicate-option").length,
      0,
    );
  }
  const diagnostics = lintDocument(
    document(
      "[mysqld]\nloose_server_id=1\n[client]\nserver-id=3\n[mysqld]\nserver-id=2",
    ),
    lintOptions,
  );
  const duplicates = diagnostics.filter(
    (item) => item.code === "duplicate-option",
  );
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].range.start.line, 5);
  assert.equal(
    duplicates[0].relatedInformation[0].location.range.start.line,
    1,
  );
});

test("lint handles templates, empty values and repeated sections", () => {
  const messages = (text, options = lintOptions) =>
    lintDocument(document(text), options).map((item) => item.message);
  assert.equal(messages("[mysqld]\nserver-id={{ server_id }}").length, 0);
  assert.match(
    messages("[mysqld]\nserver-id={{ server_id }}", {
      ...lintOptions,
      allowTemplatePlaceholders: false,
    })[0],
    /disabled/,
  );
  assert.match(messages("[mysqld]\nport=")[0], /empty value/);
  assert.match(
    messages(
      "[mysqld]\nport=3306\n[client]\nport=3306\n[mysqld]\nport=3307",
    )[0],
    /First seen on line 2/,
  );
  assert.equal(
    messages("[mysqld]\nplugin-load-add=a\nplugin-load-add=b").length,
    0,
  );
});
