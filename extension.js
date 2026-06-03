const vscode = require("vscode");

const LANGUAGE_ID = "mysql-cnf";

const DEFAULT_ALLOWED_SECTIONS = [
  "client",
  "client-server",
  "embedded",
  "isamchk",
  "mariadb",
  "myisamchk",
  "mysql",
  "mysql.server",
  "mysqladmin",
  "mysqlbinlog",
  "mysqlcheck",
  "mysqld",
  "mysqld_safe",
  "mysqldump",
  "mysqlimport",
  "mysqlpump",
  "mysqlshow",
  "mysqlslap",
  "mysqltest",
  "server",
];

const DEFAULT_REPEATABLE_OPTIONS = [
  "binlog-do-db",
  "binlog-ignore-db",
  "ignore-db-dir",
  "init-connect",
  "loose-plugin-load",
  "performance-schema-instrument",
  "plugin-load",
  "plugin-load-add",
  "replicate-do-db",
  "replicate-ignore-db",
  "replicate-wild-do-table",
  "replicate-wild-ignore-table",
];

const BOOLEAN_OPTIONS = new Set([
  "innodb-file-per-table",
  "innodb-stats-auto-recalc",
  "innodb-stats-on-metadata",
  "innodb-stats-persistent",
  "innodb-undo-log-truncate",
  "innodb-use-native-aio",
  "jemalloc-profiling",
  "log-replica-updates",
  "log-slow-admin-statements",
  "log-slow-replica-statements",
  "mysql-native-password",
  "performance-schema",
  "skip-external-locking",
  "skip-name-resolve",
  "slow-query-log",
  "thread-statistics",
  "userstat",
]);

const INTEGER_OPTIONS = new Set([
  "binlog-expire-logs-seconds",
  "innodb-autoinc-lock-mode",
  "innodb-change-buffer-max-size",
  "innodb-flush-log-at-trx-commit",
  "innodb-io-capacity",
  "innodb-io-capacity-max",
  "innodb-lru-scan-depth",
  "innodb-open-files",
  "innodb-page-cleaners",
  "innodb-purge-threads",
  "innodb-stats-persistent-sample-pages",
  "innodb-sync-spin-loops",
  "innodb-thread-concurrency",
  "key-cache-division-limit",
  "log-error-verbosity",
  "log-slow-rate-limit",
  "nice",
  "open-files-limit",
  "port",
  "server-id",
  "slow-query-log-always-write-time",
  "sync-binlog",
  "table-definition-cache",
  "table-open-cache",
  "thread-cache-size",
  "thread-pool-oversubscribe",
]);

const SIZE_OPTIONS = new Set([
  "innodb-buffer-pool-size",
  "innodb-log-buffer-size",
  "innodb-log-file-size",
  "innodb-max-undo-log-size",
  "key-buffer",
  "key-buffer-size",
  "max-allowed-packet",
  "max-binlog-size",
  "max-heap-table-size",
  "myisam-sort-buffer-size",
  "read-buffer-size",
  "read-rnd-buffer-size",
  "sort-buffer-size",
  "thread-stack",
  "tmp-table-size",
]);

function activate(context) {
  const diagnostics = vscode.languages.createDiagnosticCollection("mysql-cnf");
  context.subscriptions.push(diagnostics);

  const selector = { language: LANGUAGE_ID, scheme: "file" };

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(selector, {
      provideDocumentFormattingEdits(document) {
        const formatted = formatText(document.getText(), getFormatterOptions());
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(document.getText().length),
        );
        return [vscode.TextEdit.replace(fullRange, formatted)];
      },
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mysqlCnf.formatDocument", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !isMysqlCnfDocument(editor.document)) {
        vscode.window.showWarningMessage(
          "Open a MySQL CNF file before formatting.",
        );
        return;
      }

      await vscode.commands.executeCommand("editor.action.formatDocument");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mysqlCnf.lintDocument", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !isMysqlCnfDocument(editor.document)) {
        vscode.window.showWarningMessage(
          "Open a MySQL CNF file before linting.",
        );
        return;
      }

      updateDiagnostics(editor.document, diagnostics);
      const count = diagnostics.get(editor.document.uri)?.length ?? 0;
      const suffix = count === 1 ? "issue" : "issues";
      vscode.window.showInformationMessage(
        count === 0
          ? "MySQL CNF: no lint issues found."
          : `MySQL CNF: found ${count} ${suffix}.`,
      );
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (isMysqlCnfDocument(document)) {
        updateDiagnostics(document, diagnostics);
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (isMysqlCnfDocument(event.document)) {
        updateDiagnostics(event.document, diagnostics);
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (isMysqlCnfDocument(document)) {
        updateDiagnostics(document, diagnostics);
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      diagnostics.delete(document.uri);
    }),
  );

  vscode.workspace.textDocuments
    .filter(isMysqlCnfDocument)
    .forEach((document) => updateDiagnostics(document, diagnostics));
}

function deactivate() {}

function isMysqlCnfDocument(document) {
  if (!document || document.uri.scheme !== "file") {
    return false;
  }

  if (document.languageId === LANGUAGE_ID) {
    return true;
  }

  const fileName = document.fileName.split(/[\\/]/).pop().toLowerCase();
  return (
    fileName === "my.cnf" || fileName === "my.ini" || fileName.endsWith(".cnf")
  );
}

function getFormatterOptions() {
  const config = vscode.workspace.getConfiguration("mysqlCnf");
  return {
    alignEquals: config.get("format.alignEquals", true),
    finalNewline: config.get("format.finalNewline", true),
    inlineCommentColumn: Math.max(
      0,
      config.get("format.inlineCommentColumn", 48),
    ),
  };
}

function getLintOptions() {
  const config = vscode.workspace.getConfiguration("mysqlCnf");
  return {
    allowTemplatePlaceholders: config.get(
      "lint.allowTemplatePlaceholders",
      true,
    ),
    allowedSections: mergeConfigSet(
      DEFAULT_ALLOWED_SECTIONS,
      config.get("lint.allowedSections", []),
      normalizeSectionName,
    ),
    repeatableOptions: mergeConfigSet(
      DEFAULT_REPEATABLE_OPTIONS,
      config.get("lint.repeatableOptions", []),
      normalizeOptionName,
    ),
    warnOnUnknownSections: config.get("lint.warnOnUnknownSections", true),
  };
}

function mergeConfigSet(defaults, configured, normalize) {
  const values = Array.isArray(configured) ? configured : [];
  return new Set(
    [...defaults, ...values].map((value) => normalize(String(value))),
  );
}

function formatText(text, options) {
  const lineEnding = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = normalizeLineEndings(text).split("\n");

  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  const formattedLines = [];
  let optionBlock = [];

  const flushOptionBlock = () => {
    if (optionBlock.length > 0) {
      formattedLines.push(...formatOptionBlock(optionBlock, options));
      optionBlock = [];
    }
  };

  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed.type === "option") {
      optionBlock.push(parsed);
      continue;
    }

    flushOptionBlock();
    formattedLines.push(formatNonOptionLine(parsed));
  }

  flushOptionBlock();

  let formatted = formattedLines.join(lineEnding);
  if (options.finalNewline) {
    formatted += lineEnding;
  }

  return formatted;
}

function formatOptionBlock(block, options) {
  const keyWidth = options.alignEquals
    ? Math.max(
        ...block
          .filter((item) => item.hasEquals)
          .map((item) => item.key.length),
        0,
      )
    : 0;

  return block.map((item) => {
    let base;
    if (item.hasEquals) {
      const separator = options.alignEquals
        ? `${" ".repeat(keyWidth - item.key.length + 1)}= `
        : " = ";
      base = `${item.key}${separator}${item.value}`.trimEnd();
    } else {
      base = item.key;
    }

    return appendInlineComment(base, item.comment, options.inlineCommentColumn);
  });
}

function formatNonOptionLine(parsed) {
  if (parsed.type === "blank") {
    return "";
  }

  if (parsed.type === "comment") {
    return formatComment(parsed.comment);
  }

  if (parsed.type === "section") {
    return appendInlineComment(`[${parsed.name}]`, parsed.comment, 0);
  }

  if (parsed.type === "include") {
    return appendInlineComment(
      parsed.main.replace(/\s+/g, " "),
      parsed.comment,
      0,
    );
  }

  return parsed.text.trim();
}

function appendInlineComment(base, comment, preferredColumn) {
  if (!comment) {
    return base;
  }

  const formattedComment = formatComment(comment);
  if (preferredColumn <= 0) {
    return `${base} ${formattedComment}`.trimEnd();
  }

  const padding =
    base.length < preferredColumn
      ? " ".repeat(preferredColumn - base.length)
      : " ";
  return `${base}${padding}${formattedComment}`.trimEnd();
}

function formatComment(comment) {
  const trimmed = comment.trim();
  const match = /^([#;]+)(.*)$/.exec(trimmed);
  if (!match) {
    return trimmed;
  }

  const [, marker, body] = match;
  const normalizedBody = body.trim();
  return normalizedBody ? `${marker} ${normalizedBody}` : marker;
}

function updateDiagnostics(document, collection) {
  collection.set(document.uri, lintDocument(document, getLintOptions()));
}

function lintDocument(document, options) {
  const diagnostics = [];
  const seenOptions = new Map();
  const lines = normalizeLineEndings(document.getText()).split("\n");
  let currentSection = "";

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (lineIndex === lines.length - 1 && line === "") {
      continue;
    }

    const trimmedRight = line.trimEnd();
    if (line.length !== trimmedRight.length) {
      diagnostics.push(
        createDiagnostic(
          lineIndex,
          trimmedRight.length,
          line.length,
          "Trailing whitespace will be removed by the formatter.",
          vscode.DiagnosticSeverity.Information,
        ),
      );
    }

    if (line.includes("\t")) {
      diagnostics.push(
        createDiagnostic(
          lineIndex,
          line.indexOf("\t"),
          line.indexOf("\t") + 1,
          "Use spaces for alignment in MySQL CNF files.",
          vscode.DiagnosticSeverity.Information,
        ),
      );
    }

    const parsed = parseLine(line);

    if (parsed.type === "blank" || parsed.type === "comment") {
      continue;
    }

    if (parsed.type === "section") {
      const normalizedSection = normalizeSectionName(parsed.name);
      currentSection = normalizedSection;

      if (!/^[A-Za-z0-9_.-]+$/.test(parsed.name)) {
        diagnostics.push(
          createDiagnostic(
            lineIndex,
            line.indexOf(parsed.name),
            line.indexOf(parsed.name) + parsed.name.length,
            "Section names should contain only letters, numbers, dots, underscores, or hyphens.",
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }

      if (
        options.warnOnUnknownSections &&
        !isKnownSection(normalizedSection, options.allowedSections)
      ) {
        diagnostics.push(
          createDiagnostic(
            lineIndex,
            line.indexOf(parsed.name),
            line.indexOf(parsed.name) + parsed.name.length,
            `Unknown MySQL option group '${parsed.name}'.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }

      continue;
    }

    if (parsed.type === "include") {
      validateIncludeDirective(parsed, line, lineIndex, diagnostics);
      continue;
    }

    if (parsed.type === "unknown") {
      diagnostics.push(
        createDiagnostic(
          lineIndex,
          firstNonWhitespaceIndex(line),
          line.length,
          line.trim().startsWith("[")
            ? "Malformed section header."
            : "Cannot parse MySQL CNF option line.",
          vscode.DiagnosticSeverity.Error,
        ),
      );
      continue;
    }

    validateOptionLine(
      parsed,
      line,
      lineIndex,
      currentSection,
      seenOptions,
      diagnostics,
      options,
    );
  }

  return diagnostics;
}

function validateIncludeDirective(parsed, line, lineIndex, diagnostics) {
  const parts = parsed.main.trim().split(/\s+/);
  if (parts.length < 2) {
    diagnostics.push(
      createDiagnostic(
        lineIndex,
        firstNonWhitespaceIndex(line),
        line.length,
        "Include directives require a path.",
        vscode.DiagnosticSeverity.Warning,
      ),
    );
  }
}

function validateOptionLine(
  parsed,
  line,
  lineIndex,
  currentSection,
  seenOptions,
  diagnostics,
  options,
) {
  const keyStart = Math.max(0, line.indexOf(parsed.key));
  const keyEnd = keyStart + parsed.key.length;

  if (!currentSection) {
    diagnostics.push(
      createDiagnostic(
        lineIndex,
        keyStart,
        keyEnd,
        "Option appears before any section header.",
        vscode.DiagnosticSeverity.Warning,
      ),
    );
  }

  if (!parsed.key) {
    diagnostics.push(
      createDiagnostic(
        lineIndex,
        firstNonWhitespaceIndex(line),
        line.length,
        "Option name is missing.",
        vscode.DiagnosticSeverity.Error,
      ),
    );
    return;
  }

  if (/\s/.test(parsed.key)) {
    diagnostics.push(
      createDiagnostic(
        lineIndex,
        keyStart,
        keyEnd,
        "Option names cannot contain whitespace.",
        vscode.DiagnosticSeverity.Error,
      ),
    );
  }

  const normalizedOption = normalizeOptionName(parsed.key);
  const seenKey = `${currentSection}\u0000${normalizedOption}`;
  const firstLine = seenOptions.get(seenKey);
  if (
    firstLine !== undefined &&
    !options.repeatableOptions.has(normalizedOption)
  ) {
    diagnostics.push(
      createDiagnostic(
        lineIndex,
        keyStart,
        keyEnd,
        `Duplicate option '${parsed.key}' in this section. First seen on line ${firstLine + 1}.`,
        vscode.DiagnosticSeverity.Warning,
      ),
    );
  } else {
    seenOptions.set(seenKey, lineIndex);
  }

  validateOptionValue(parsed, line, lineIndex, diagnostics, options);
}

function validateOptionValue(parsed, line, lineIndex, diagnostics, options) {
  if (!parsed.hasEquals) {
    return;
  }

  const normalizedOption = normalizeOptionName(parsed.key);
  const value = parsed.value.trim();
  const valueStart = Math.max(0, line.indexOf(parsed.value));
  const valueEnd = valueStart + parsed.value.length;

  if (!value) {
    diagnostics.push(
      createDiagnostic(
        lineIndex,
        valueStart,
        Math.max(valueStart + 1, valueEnd),
        `Option '${parsed.key}' has an empty value.`,
        vscode.DiagnosticSeverity.Warning,
      ),
    );
    return;
  }

  if (looksLikeTemplatePlaceholder(value)) {
    if (!options.allowTemplatePlaceholders) {
      diagnostics.push(
        createDiagnostic(
          lineIndex,
          valueStart,
          valueEnd,
          "Template placeholders are disabled for MySQL CNF linting.",
          vscode.DiagnosticSeverity.Warning,
        ),
      );
    }
    return;
  }

  const unquotedValue = stripMatchingQuotes(value);
  if (
    isBooleanOption(normalizedOption) &&
    !/^(0|1|on|off|true|false|yes|no)$/i.test(unquotedValue)
  ) {
    diagnostics.push(
      createDiagnostic(
        lineIndex,
        valueStart,
        valueEnd,
        `Option '${parsed.key}' usually expects a boolean value such as ON or OFF.`,
        vscode.DiagnosticSeverity.Warning,
      ),
    );
  }

  if (INTEGER_OPTIONS.has(normalizedOption) && !/^\d+$/.test(unquotedValue)) {
    diagnostics.push(
      createDiagnostic(
        lineIndex,
        valueStart,
        valueEnd,
        `Option '${parsed.key}' usually expects an integer value.`,
        vscode.DiagnosticSeverity.Warning,
      ),
    );
  }

  if (
    SIZE_OPTIONS.has(normalizedOption) &&
    !/^\d+(?:[KMGTEP]B?|B)?$/i.test(unquotedValue)
  ) {
    diagnostics.push(
      createDiagnostic(
        lineIndex,
        valueStart,
        valueEnd,
        `Option '${parsed.key}' usually expects a size such as 256M or 4G.`,
        vscode.DiagnosticSeverity.Warning,
      ),
    );
  }
}

function parseLine(rawLine) {
  const trimmedRight = rawLine.trimEnd();
  const trimmed = trimmedRight.trim();

  if (!trimmed) {
    return { type: "blank" };
  }

  if (trimmed.startsWith("#") || trimmed.startsWith(";")) {
    return { type: "comment", comment: trimmed };
  }

  const split = splitInlineComment(trimmedRight);
  const main = split.main.trim();

  if (!main && split.comment) {
    return { type: "comment", comment: split.comment };
  }

  if (/^!include(?:dir)?\b/i.test(main)) {
    return { type: "include", main, comment: split.comment };
  }

  const sectionMatch = /^\[\s*([^\]]+?)\s*\]$/.exec(main);
  if (sectionMatch) {
    return {
      type: "section",
      name: sectionMatch[1].trim(),
      comment: split.comment,
    };
  }

  if (main.startsWith("[") || main.includes("]")) {
    return { type: "unknown", text: trimmed, comment: split.comment };
  }

  const equalIndex = findUnquotedEqual(main);
  if (equalIndex >= 0) {
    return {
      type: "option",
      key: main.slice(0, equalIndex).trim(),
      value: main.slice(equalIndex + 1).trim(),
      hasEquals: true,
      comment: split.comment,
    };
  }

  return {
    type: "option",
    key: main.trim(),
    value: "",
    hasEquals: false,
    comment: split.comment,
  };
}

function splitInlineComment(text) {
  let quote = "";

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const previous = index > 0 ? text[index - 1] : "";

    if ((character === "'" || character === '"') && previous !== "\\") {
      quote = quote === character ? "" : quote || character;
      continue;
    }

    if (
      !quote &&
      (character === "#" || character === ";") &&
      (index === 0 || /\s/.test(previous))
    ) {
      return {
        main: text.slice(0, index).trimEnd(),
        comment: text.slice(index).trim(),
      };
    }
  }

  return { main: text.trimEnd(), comment: "" };
}

function findUnquotedEqual(text) {
  let quote = "";

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const previous = index > 0 ? text[index - 1] : "";

    if ((character === "'" || character === '"') && previous !== "\\") {
      quote = quote === character ? "" : quote || character;
      continue;
    }

    if (!quote && character === "=") {
      return index;
    }
  }

  return -1;
}

function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function normalizeOptionName(optionName) {
  return optionName.trim().toLowerCase().replace(/_/g, "-");
}

function normalizeSectionName(sectionName) {
  return sectionName.trim().toLowerCase();
}

function isKnownSection(sectionName, allowedSections) {
  if (allowedSections.has(sectionName)) {
    return true;
  }

  return /^(mysqld|mysql|mariadb|client|server)[-.].+/.test(sectionName);
}

function isBooleanOption(optionName) {
  return (
    BOOLEAN_OPTIONS.has(optionName) ||
    optionName.startsWith("performance-schema-consumer-")
  );
}

function looksLikeTemplatePlaceholder(value) {
  return /{{\s*[^}]+\s*}}|<%[=-]?[\s\S]*?%>/.test(value);
}

function stripMatchingQuotes(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
      return value.slice(1, -1);
    }
  }

  return value;
}

function firstNonWhitespaceIndex(line) {
  const match = /\S/.exec(line);
  return match ? match.index : 0;
}

function createDiagnostic(
  lineIndex,
  startCharacter,
  endCharacter,
  message,
  severity,
) {
  const start = Math.max(0, startCharacter);
  const end = Math.max(start + 1, endCharacter);
  return new vscode.Diagnostic(
    new vscode.Range(lineIndex, start, lineIndex, end),
    message,
    severity,
  );
}

module.exports = {
  activate,
  deactivate,
  formatText,
  lintDocument,
  parseLine,
};
