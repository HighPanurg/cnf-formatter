const assert = require("node:assert/strict");
const test = require("node:test");
const { loadExtension, document, Position } = require("./helpers");

function harness(documents) {
  const events = {};
  const providers = {};
  const commands = {};
  const values = new Map();
  const writes = [];
  const timers = new Map();
  const settings = new Map();
  const scopes = [];
  const disposable = { dispose() {} };
  const workspace = {
    textDocuments: documents,
    getConfiguration: (name, scope) => {
      assert.equal(name, "mysqlCnf");
      assert.ok(
        documents.includes(scope),
        "configuration must be scoped to its document",
      );
      scopes.push(scope);
      return { get: (key, fallback) => settings.get(scope)?.[key] ?? fallback };
    },
  };
  for (const name of [
    "OpenTextDocument",
    "ChangeTextDocument",
    "SaveTextDocument",
    "CloseTextDocument",
    "ChangeConfiguration",
  ]) {
    workspace[`onDid${name}`] = (listener) => {
      events[name] = listener;
      return disposable;
    };
  }
  const languages = {
    createDiagnosticCollection: () => ({
      set: (uri, diagnostics) => {
        values.set(uri, diagnostics);
        writes.push(uri);
      },
      get: (uri) => values.get(uri),
      delete: (uri) => values.delete(uri),
      dispose() {},
    }),
  };
  for (const name of [
    "DocumentFormattingEdit",
    "Hover",
    "CompletionItem",
    "CodeActions",
  ]) {
    languages[`register${name}Provider`] = (selector, provider) => {
      assert.equal(selector.language, "mysql-cnf");
      assert.equal(selector.scheme, undefined);
      providers[name] = provider;
      return disposable;
    };
  }
  const window = {
    activeTextEditor: { document: documents[0] },
    showInformationMessage() {},
    showWarningMessage() {},
  };
  const extension = loadExtension(
    {
      workspace,
      languages,
      window,
      commands: {
        registerCommand: (name, callback) => {
          commands[name] = callback;
          return disposable;
        },
      },
      TextEdit: { replace: (range, newText) => ({ range, newText }) },
    },
    {
      setTimeout: (callback, delay) => {
        assert.equal(delay, 250);
        const timer = {};
        timers.set(timer, callback);
        return timer;
      },
      clearTimeout: (timer) => timers.delete(timer),
    },
  );
  const context = { subscriptions: [] };
  extension.activate(context);
  return {
    events,
    providers,
    values,
    writes,
    timers,
    settings,
    scopes,
    commands,
    window,
    context,
  };
}

function cnf(scheme, text = "[mysqld]\nport=invalid") {
  return document(text, {
    uri: { scheme, toString: () => `${scheme}:///my.cnf` },
  });
}

test("activation supports untitled and remote documents but respects language reassignment", () => {
  const remote = cnf("vscode-remote");
  const untitled = cnf("untitled");
  const other = document("[mysqld]\nport=invalid", { languageId: "plaintext" });
  const state = harness([remote, untitled, other]);
  assert.equal(state.values.size, 2);
  assert.ok(state.values.get(remote.uri).length);
  assert.ok(state.values.get(untitled.uri).length);
  state.events.OpenTextDocument(untitled);
  assert.equal(state.writes.length, 3);
  state.events.OpenTextDocument(other);
  assert.equal(state.writes.length, 3);
});

test("typing is debounced while save, manual lint and close cancel pending work", () => {
  const doc = cnf("untitled");
  const state = harness([doc]);
  const change = () =>
    state.events.ChangeTextDocument({ document: doc, contentChanges: [{}] });
  state.events.ChangeTextDocument({ document: doc, contentChanges: [] });
  assert.equal(state.timers.size, 0);
  change();
  change();
  change();
  assert.equal(state.writes.length, 1);
  assert.equal(state.timers.size, 1);
  [...state.timers.values()][0]();
  assert.equal(state.writes.length, 2);
  assert.equal(state.timers.size, 0);
  change();
  state.events.SaveTextDocument(doc);
  assert.equal(state.writes.length, 3);
  assert.equal(state.timers.size, 0);
  change();
  state.commands["mysqlCnf.lintDocument"]();
  assert.equal(state.writes.length, 4);
  assert.equal(state.timers.size, 0);
  change();
  state.events.CloseTextDocument(doc);
  assert.equal(state.values.size, 0);
  assert.equal(state.timers.size, 0);
  change();
  for (const subscription of state.context.subscriptions)
    subscription.dispose();
  assert.equal(state.timers.size, 0);
});

test("resource settings apply to formatting, hover, completions and configuration refresh", () => {
  const mysql = cnf("file", "[mysqld]\nbinlog-format=ROW\n");
  const maria = cnf("vscode-remote", "[mysqld]\nbinlog-format=ROW\n");
  const state = harness([mysql, maria]);
  state.settings.set(mysql, {
    "target.flavor": "mysql",
    "target.version": "8.4",
  });
  state.settings.set(maria, {
    "target.flavor": "mariadb",
    "target.version": "10.11",
    "format.finalNewline": false,
  });
  state.events.ChangeTextDocument({ document: mysql, contentChanges: [{}] });
  state.events.ChangeConfiguration({
    affectsConfiguration: (name, uri) =>
      name === "mysqlCnf" && uri === mysql.uri,
  });
  assert.equal(state.timers.size, 0);
  assert.equal(state.writes.length, 3);
  assert.ok(
    state.values
      .get(mysql.uri)
      .some((entry) => entry.code === "deprecated-option"),
  );
  assert.ok(
    !state.values
      .get(maria.uri)
      .some((entry) => entry.code === "deprecated-option"),
  );
  const mysqlHover = state.providers.Hover.provideHover(
    mysql,
    new Position(1, 3),
  );
  assert.match(mysqlHover.contents.value, /Deprecated since MySQL/);
  const mariaHover = state.providers.Hover.provideHover(
    maria,
    new Position(1, 3),
  );
  assert.doesNotMatch(mariaHover.contents.value, /Deprecated since MySQL/);
  const suggestions = state.providers.CompletionItem.provideCompletionItems(
    maria,
    new Position(2, 0),
  );
  assert.ok(suggestions.some((item) => item.label === "userstat"));
  assert.ok(
    !suggestions.some((item) => item.label === "innodb-redo-log-capacity"),
  );
  const edits =
    state.providers.DocumentFormattingEdit.provideDocumentFormattingEdits(
      maria,
    );
  assert.ok(!edits[0].newText.endsWith("\n"));
  assert.ok(state.scopes.includes(mysql));
  assert.ok(state.scopes.includes(maria));
});

test("formatting unchanged text produces no edit", () => {
  const doc = cnf("untitled", "[mysqld]\nport = 3306\n");
  const state = harness([doc]);
  assert.equal(
    state.providers.DocumentFormattingEdit.provideDocumentFormattingEdits(doc)
      .length,
    0,
  );
});
