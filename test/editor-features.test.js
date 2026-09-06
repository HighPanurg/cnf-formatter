const assert = require("node:assert/strict");
const test = require("node:test");
const { loadExtension, document, lintOptions, Position } = require("./helpers");

function extensionWithSettings(settings = {}) {
  return loadExtension({
    workspace: {
      getConfiguration: () => ({
        get: (key, fallback) => settings[key] ?? fallback,
      }),
    },
  });
}

function completions(text, settings = {}, character) {
  const doc = document(text);
  const line = doc.lineCount - 1;
  return extensionWithSettings(settings).provideMysqlCnfCompletions(
    doc,
    new Position(line, character ?? doc.lineAt(line).text.length),
  );
}

test("completions are section-aware and handle versioned and custom groups", () => {
  const labels = (text) => completions(text).map((item) => item.label);
  assert.ok(labels("[mysqld]\n").includes("innodb-buffer-pool-size"));
  assert.ok(!labels("[client]\n").includes("innodb-buffer-pool-size"));
  assert.ok(labels("[client]\n").includes("host"));
  assert.ok(labels("[mysqldump]\n").includes("quote-names"));
  assert.ok(!labels("[mysql]\n").includes("quote-names"));
  assert.ok(labels("[mysqld-8.4]\n").includes("innodb-buffer-pool-size"));
  assert.ok(labels("[custom]\n").includes("innodb-buffer-pool-size"));
  assert.ok(!labels("[client-server]\n").includes("host"));
  assert.ok(labels("[client-server]\n").includes("port"));
  assert.ok(labels("").includes("mysqld"));
  const section = completions("[my]", {}, 3).find(
    (item) => item.label === "mysqld",
  );
  assert.equal(section.insertText, "mysqld]");
  assert.equal(section.range.end.character, 4);
});

test("completions filter incompatible options and tag deprecated ones", () => {
  const items = completions("[mysqld]\n", {
    "target.flavor": "mysql",
    "target.version": "9.0",
  });
  assert.ok(!items.some((item) => item.label === "mysql-native-password"));
  assert.ok(!items.some((item) => item.label === "userstat"));
  assert.equal(items.find((item) => item.label === "binlog-format").tags[0], 1);
  const maria = completions("[mysqld]\n", {
    "target.flavor": "mariadb",
    "target.version": "10.11",
  });
  assert.ok(maria.some((item) => item.label === "userstat"));
  assert.ok(!maria.some((item) => item.label === "innodb-redo-log-capacity"));
});

test("key completions preserve assignments, spelling and repeatable options", () => {
  const text = "[mysqld]\nserver_id=1\nplugin-load-add=a\n[mysqld]\n";
  const items = completions(text);
  assert.ok(!items.some((item) => item.label === "server-id"));
  assert.ok(items.some((item) => item.label === "plugin-load-add"));
  const item = completions("[mysqld]\ninnodb_buf = 1G # existing", {}, 10).find(
    (entry) => entry.label === "innodb_buffer_pool_size",
  );
  assert.equal(item.insertText, "innodb_buffer_pool_size");
  assert.equal(item.range.end.character, 10);
  assert.ok(
    completions("[mysqld]\nloose_innodb_").some(
      (entry) => entry.label === "loose_innodb_buffer_pool_size",
    ),
  );
});

test("value completions preserve quotes and comments and skip templates", () => {
  const items = completions('[mysqld]\nbinlog-format="RO" # keep', {}, 16);
  const row = items.find((item) => item.label === "ROW");
  assert.equal(row.range.start.character, 15);
  assert.equal(row.range.end.character, 17);
  for (const line of [
    "slow-query-log=",
    "slow-query-log= ",
    'slow-query-log="',
    "slow-query-log =   ",
  ]) {
    assert.ok(
      completions(`[mysqld]\n${line}`).some((item) => item.label === "ON"),
    );
  }
  for (const text of [
    "[mysqld]\n# port",
    "[mysqld]\n!include /tmp/",
    "[mysqld]\nport=1 # note",
    "[mysqld]\nport={{",
    "[mysqld]\nport=<%=",
  ]) {
    assert.equal(completions(text).length, 0);
  }
});

test("hover includes shared metadata, compatibility and documentation", () => {
  const extension = extensionWithSettings({
    "target.flavor": "mysql",
    "target.version": "8.4",
  });
  const hover = extension.provideMysqlCnfHover(
    document("binlog-format=ROW"),
    new Position(0, 3),
  );
  assert.match(hover.contents.value, /Allowed values: ROW, STATEMENT, MIXED/);
  assert.match(hover.contents.value, /Deprecated since MySQL 8.0.34/);
  assert.match(hover.contents.value, /\[Documentation\]\(https:\/\//);
  assert.equal(hover.contents.isTrusted, false);
});

test("quick fixes remove only whitespace and require duplicate review", () => {
  const extension = loadExtension();
  const doc = document("[mysqld]\nport=3306\nport=3307  ");
  const diagnostics = extension.lintDocument(doc, lintOptions);
  const actions = extension.provideMysqlCnfCodeActions(doc, undefined, {
    diagnostics,
  });
  const whitespace = actions.find((action) => action.edit);
  assert.equal(whitespace.edit.edits[0].range.start.character, 9);
  assert.equal(whitespace.edit.edits[0].range.end.character, 11);
  const review = actions.find((action) => action.command);
  assert.equal(review.command.command, "mysqlCnf.reviewDuplicate");
  assert.equal(review.edit, undefined);
  const duplicate = diagnostics.find(
    (item) => item.code === "duplicate-option",
  );
  assert.equal(duplicate.relatedInformation[0].location.range.start.line, 1);
});

test("duplicate review supports cancellation, explicit removal and stale document protection", async () => {
  for (const choice of [undefined, "Remove Later Declaration", "changed"]) {
    const doc = document("[mysqld]\nport=3306\nport=3307 # retain comment");
    const edits = [];
    let revealed;
    const extension = loadExtension({
      workspace: {
        getConfiguration: () => ({ get: (key, fallback) => fallback }),
        openTextDocument: async () => doc,
        applyEdit: async (edit) => {
          edits.push(edit);
          return true;
        },
      },
      window: {
        showTextDocument: async (opened, options) => {
          revealed = options.selection;
        },
        showWarningMessage: async (message, options) => {
          if (!options) return undefined;
          assert.equal(options.modal, true);
          assert.match(options.detail, /port=3306/);
          assert.match(options.detail, /port=3307/);
          if (choice === "changed") doc.version += 1;
          return choice === "changed" ? "Remove Later Declaration" : choice;
        },
      },
    });
    await extension.reviewDuplicate(doc.uri, 2);
    assert.equal(revealed.start.line, 1);
    assert.equal(edits.length, choice === "Remove Later Declaration" ? 1 : 0);
    if (edits.length)
      assert.equal(edits[0].edits[0].newText, "# retain comment");
  }
});
