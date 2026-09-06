class MarkdownString {
  constructor() {
    this.value = "";
  }
  appendMarkdown(value) {
    this.value += value;
    return this;
  }
}

class WorkspaceEdit {
  constructor() {
    this.edits = [];
  }
  delete(uri, range) {
    this.edits.push({ uri, range, newText: "" });
  }
  replace(uri, range, newText) {
    this.edits.push({ uri, range, newText });
  }
}

module.exports = {
  MarkdownString,
  WorkspaceEdit,
  DiagnosticRelatedInformation: class {
    constructor(location, message) {
      Object.assign(this, { location, message });
    }
  },
  Location: class {
    constructor(uri, range) {
      Object.assign(this, { uri, range });
    }
  },
  Hover: class {
    constructor(contents, range) {
      Object.assign(this, { contents, range });
    }
  },
  CompletionItem: class {
    constructor(label, kind) {
      Object.assign(this, { label, kind });
    }
  },
  CompletionItemKind: { Module: 8, Property: 9, Value: 11 },
  CompletionItemTag: { Deprecated: 1 },
  CodeAction: class {
    constructor(title, kind) {
      Object.assign(this, { title, kind });
    }
  },
  CodeActionKind: { QuickFix: "quickfix" },
  workspace: { getConfiguration: () => ({ get: (key, fallback) => fallback }) },
};
