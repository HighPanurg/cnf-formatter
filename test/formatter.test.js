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

test("comments follow MySQL: unquoted # anywhere, ; only at line start", () => {
  const hash = parseLine("password=abc#123");
  assert.equal(hash.value, "abc");
  assert.equal(hash.comment, "#123");
  assert.equal(parseLine('password="abc#123"').value, '"abc#123"');
  assert.equal(parseLine("password = abc ;def").value, "abc ;def");
  for (const [input, output] of [
    ["password = abc ;def", "password = abc ;def"],
    ["password=abc#123", "password = abc#123"],
    ['token=abc"def"#123', 'token = abc"def"#123'],
    [
      'password="{{ password | default("#123") }}"',
      'password = "{{ password | default("#123") }}"',
    ],
    ["password='abc'#note", "password = 'abc'".padEnd(48) + "# note"],
  ]) {
    const formatted = formatText(`[client]\n${input}`, formatOptions);
    assert.equal(formatted, `[client]\n${output}\n`);
    assert.equal(formatText(formatted, formatOptions), formatted);
  }
  assert.equal(
    formatText("!include /a.cnf # note", formatOptions),
    "!include /a.cnf # note\n",
  );
  for (const line of ["[mysqld]#main", "[mysqld] ; main"]) {
    assert.equal(parseLine(line).type, "section");
    assert.equal(lintDocument(document(line), lintOptions).length, 0);
  }
  // Text after ']' is ignored by MySQL; the group still applies to later lines.
  assert.equal(
    lintDocument(document("[mysqld] main settings\nport = 3306"), lintOptions)
      .map((item) => item.code)
      .join(" "),
    "text-after-section",
  );
});

test("lint flags values MySQL reads differently than written", () => {
  const codes = (line) =>
    lintDocument(document(`[mysqld]\n${line}`), lintOptions)
      .map((item) => item.code)
      .join(" ");
  for (const [line, expected] of [
    ["password=abc#123", "unquoted-hash"],
    ["password='abc'#note", ""],
    ['token=abc"def"#123', "unquoted-hash"],
    ["password={{ db_password }}#123", "unquoted-hash"],
    ['password="{{ password | default("abc#123") }}"', ""],
    ['password="{{ password | default("abc#123") }}"#1', ""],
    ["password=<%= @pw %>x#1", "unquoted-hash"],
    ["server-id = {{ id }} {# note #}", ""],
    ["server-id=123 <%# note %>", ""],
    ["server-id = 123 {# note #}", ""],
    ["server-id = {# note #}{{ server_id }}", ""],
    ["token=abc{#123", "unquoted-hash"],
    ["token=abc<%#123", "unquoted-hash"],
    ["token=abc{# note #}#123", "unquoted-hash"],
    ["token=abc<%# note %>#123", "unquoted-hash"],
    ["token=abc{# note #} #123", ""],
    ["log-error = /tmp/x.err ; old", "inline-semicolon"],
    ["log-error = ; old", "inline-semicolon"],
    ["init-connect=SET @label='left ; right'", ""],
    ["init-connect=SET @a='it\\'s ; fine'", ""],
    ["init-connect=SET @a='x ; y' ; old", "inline-semicolon"],
    ["fields-terminated-by = ;", ""],
    ["[client] port=3306", "text-after-section"],
    ["init_connect = 'SET NAMES utf8mb4 # c", "unbalanced-quote"],
    ["basedir = C:\\mysql\\bin", "backslash-escape"],
    ['basedir = "C:\\temp"', "backslash-escape"],
    ["basedir = C:\\\\mysql\\\\bin", ""],
    ["basedir = C:\\ProgramData\\MySQL", ""],
    ["basedir = C:/mysql\\bin", "backslash-escape"],
    ["datadir = \\\\server\\temp\\data", "backslash-escape"],
    ["tmpdir = \\\\fileserver\\mysql\\data", "backslash-escape"],
    ["datadir = \\\\\\\\server\\temp\\data", "backslash-escape"],
    ["tmpdir = \\\\\\\\server\\mysql\\data", ""],
    ["log-error = \\\\\\\\server\\\\share\\\\x.err", ""],
    ["lines-terminated-by = \\r\\n", ""],
    ["!include /etc/mysql/a.cnf # note", "include-comment"],
    ["!INCLUDE /etc/mysql/a.cnf", "unknown-directive"],
    ["! include /etc/mysql/a.cnf", ""],
  ]) {
    assert.equal(codes(line), expected, line);
  }
  for (const [line, character] of [
    ["log-error = ; old", 12],
    ["init-connect=SET @a='x ; y' ; old", 28],
    ["token=abc{# note #}#123", 19],
  ]) {
    const [diagnostic] = lintDocument(document(`[mysqld]\n${line}`), lintOptions);
    assert.equal(diagnostic.range.start.character, character, line);
  }
});

test("yes/no are not booleans and fatal MySQL errors are errors", () => {
  const lint = (text) => lintDocument(document(text), lintOptions);
  assert.match(lint("[mysqld]\nslow_query_log = yes")[0].message, /ON, OFF/);
  assert.equal(lint("[mysqld]\nslow_query_log = TRUE").length, 0);
  for (const text of ["port = 3306\n[mysqld]", "[mysqld]\n!include"]) {
    assert.equal(lint(text)[0].severity, 0);
  }
});
