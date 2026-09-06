const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");

class Position {
  constructor(line, character) {
    this.line = line;
    this.character = character;
  }
}

class Range {
  constructor(startLine, startCharacter, endLine, endCharacter) {
    this.start =
      typeof startLine === "number"
        ? new Position(startLine, startCharacter)
        : startLine;
    this.end =
      typeof startLine === "number"
        ? new Position(endLine, endCharacter)
        : startCharacter;
  }
}

class Diagnostic {
  constructor(range, message, severity) {
    Object.assign(this, { range, message, severity });
  }
}

function loadExtension(overrides = {}) {
  const filename = path.join(__dirname, "..", "extension.js");
  const localRequire = createRequire(filename);
  const vscode = {
    Position,
    Range,
    Diagnostic,
    DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2, Hint: 3 },
    ...require("./vscode-mock"),
    ...overrides,
  };
  const sandbox = {
    module: { exports: {} },
    require: (name) => (name === "vscode" ? vscode : localRequire(name)),
    setTimeout,
    clearTimeout,
  };
  vm.runInNewContext(fs.readFileSync(filename, "utf8"), sandbox, { filename });
  return sandbox.module.exports;
}

function document(text, overrides = {}) {
  const lines = text.split(/\r?\n/);
  return {
    getText: () => text,
    lineCount: lines.length,
    version: 1,
    isClosed: false,
    lineAt: (line) => ({
      text: lines[line],
      range: new Range(line, 0, line, lines[line].length),
      rangeIncludingLineBreak:
        line + 1 < lines.length
          ? new Range(line, 0, line + 1, 0)
          : new Range(line, 0, line, lines[line].length),
    }),
    positionAt: (offset) => {
      const preceding = text.slice(0, offset).split(/\r?\n/);
      return new Position(preceding.length - 1, preceding.at(-1).length);
    },
    uri: { scheme: "file", toString: () => "file:///test/my.cnf" },
    languageId: "mysql-cnf",
    fileName: "/test/my.cnf",
    ...overrides,
  };
}

const formatOptions = {
  alignEquals: true,
  inlineCommentColumn: 48,
  finalNewline: true,
};
const lintOptions = {
  allowTemplatePlaceholders: true,
  allowedSections: new Set(["mysqld", "client"]),
  repeatableOptions: new Set(["plugin-load-add"]),
  warnOnUnknownSections: true,
};

module.exports = {
  loadExtension,
  document,
  formatOptions,
  lintOptions,
  Position,
  Range,
};
