const vscode = require("vscode");

const LANGUAGE_ID = "mysql-cnf";

const {
  SECTION_CATALOG,
  OPTION_CATALOG,
  normalizeOptionName,
  getOptionMetadata,
  getCompatibility,
  getDocumentationUrl,
} = require("./option-catalog");

const DEFAULT_ALLOWED_SECTIONS = [...SECTION_CATALOG.keys()];
const DEFAULT_REPEATABLE_OPTIONS = [...OPTION_CATALOG]
  .filter(([, info]) => info.repeatable)
  .map(([name]) => name);

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
    vscode.languages.registerHoverProvider(selector, {
      provideHover(document, position) {
        return provideMysqlCnfHover(document, position);
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
    target: getTargetOptions(config),
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

function getTargetOptions(config) {
  return {
    flavor: config.get("target.flavor", "generic"),
    version: config.get("target.version", ""),
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
    if (
      parsed.type === "option" ||
      parsed.type === "comment" ||
      parsed.type === "blank"
    ) {
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
          .filter((item) => item.type === "option" && item.hasEquals)
          .map((item) => item.key.length),
        0,
      )
    : 0;

  const formattedBlock = block.map((item) => {
    if (item.type !== "option") {
      return { line: formatNonOptionLine(item) };
    }

    let base;
    if (item.hasEquals) {
      const separator = options.alignEquals
        ? `${" ".repeat(keyWidth - item.key.length + 1)}= `
        : " = ";
      base = `${item.key}${separator}${item.value}`.trimEnd();
    } else {
      base = item.key;
    }

    return { base, comment: item.comment };
  });

  const inlineCommentColumn =
    options.inlineCommentColumn > 0
      ? Math.max(
          options.inlineCommentColumn,
          ...formattedBlock
            .filter((item) => item.base !== undefined)
            .map((item) => item.base.trimEnd().length + 1),
        )
      : 0;

  return formattedBlock.map((item) => {
    if (item.line !== undefined) {
      return item.line;
    }

    return appendInlineComment(item.base, item.comment, inlineCommentColumn);
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
      parsed.main.replace(/^(!include(?:dir)?)\s+/i, "$1 "),
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

function provideMysqlCnfHover(document, position) {
  const line = document.lineAt(position.line).text;
  const target = getHoverTarget(line, position.character);
  if (!target) {
    return undefined;
  }

  const targetOptions = getTargetOptions(
    vscode.workspace.getConfiguration("mysqlCnf", document),
  );
  const info =
    target.type === "section"
      ? getSectionHoverInfo(target.name)
      : getOptionHoverInfo(target.name, targetOptions);

  if (!info) {
    return undefined;
  }

  return new vscode.Hover(
    createHoverMarkdown(target, info, targetOptions),
    new vscode.Range(position.line, target.start, position.line, target.end),
  );
}

function getHoverTarget(line, character) {
  const parsed = parseLine(line);

  if (parsed.type === "section") {
    const sectionStart = line.indexOf("[");
    const nameStart = line.indexOf(parsed.name, sectionStart + 1);
    const start = nameStart >= 0 ? nameStart : sectionStart + 1;
    const end = start + parsed.name.length;
    if (isCharacterInRange(character, start, end)) {
      return {
        type: "section",
        name: parsed.name,
        label: `[${parsed.name}]`,
        start,
        end,
      };
    }
  }

  if (parsed.type === "option" && parsed.key) {
    const start = line.indexOf(parsed.key);
    const end = start + parsed.key.length;
    if (start >= 0 && isCharacterInRange(character, start, end)) {
      return {
        type: "option",
        name: parsed.key,
        label: parsed.key,
        start,
        end,
      };
    }
  }

  return undefined;
}

function getSectionHoverInfo(sectionName) {
  const normalizedSection = normalizeSectionName(sectionName);
  const exact = SECTION_CATALOG.get(normalizedSection);
  if (exact) {
    return exact;
  }

  if (/^(mysqld|mysql|mariadb|client|server)[-.].+/.test(normalizedSection)) {
    return {
      description:
        "Variant-specific MySQL option group. Programs read this group when they opt into matching suffix groups.",
    };
  }

  return {
    description:
      "Custom MySQL option group. It is read only by programs configured to use this group name.",
  };
}

function getOptionHoverInfo(optionName, target) {
  const info = getOptionMetadata(optionName, target);
  if (info) return info;
  return {
    description:
      "Custom or uncatalogued database option. Check the documentation for your server or client version.",
    valueType: "option value",
  };
}

function createHoverMarkdown(target, info, targetOptions = {}) {
  const markdown = new vscode.MarkdownString();
  markdown.isTrusted = false;
  markdown.supportHtml = false;

  markdown.appendMarkdown(`\`${escapeInlineCode(target.label)}\`\n\n`);
  markdown.appendMarkdown(info.description);

  if (info.valueType) {
    markdown.appendMarkdown(
      `\n\nExpected value: \`${escapeInlineCode(info.valueType)}\``,
    );
  }

  if (info.values)
    markdown.appendMarkdown(`\n\nAllowed values: ${info.values.join(", ")}`);
  if (info.minimum !== undefined)
    markdown.appendMarkdown(`\n\nMinimum: ${info.minimum}`);
  if (info.maximum !== undefined)
    markdown.appendMarkdown(`\n\nMaximum: ${info.maximum}`);
  if (info.repeatable)
    markdown.appendMarkdown("\n\nMay be repeated in the same option group.");
  if (target.type === "option") {
    const compatibility = getCompatibility(info, targetOptions);
    if (compatibility) markdown.appendMarkdown(`\n\n${compatibility.message}`);
    if (normalizeOptionName(target.name).startsWith("loose-")) {
      markdown.appendMarkdown(
        "\n\nThe loose prefix allows programs to ignore unrecognized options.",
      );
    }
    markdown.appendMarkdown(
      `\n\n[Documentation](${getDocumentationUrl(target.name, info, targetOptions)})`,
    );
  }
  markdown.appendMarkdown("\n\nSource: MySQL CNF extension");
  return markdown;
}

function isCharacterInRange(character, start, end) {
  return character >= start && character <= end;
}

function escapeInlineCode(value) {
  return String(value).replace(/`/g, "'");
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

  const info = getOptionMetadata(parsed.key, options.target);
  const compatibility = getCompatibility(info, options.target);
  if (compatibility && !normalizedOption.startsWith("loose-")) {
    diagnostics.push(
      createDiagnostic(
        lineIndex,
        keyStart,
        keyEnd,
        `Option '${parsed.key}': ${compatibility.message}`,
        vscode.DiagnosticSeverity.Warning,
        compatibility.code,
      ),
    );
  }
  validateOptionValue(parsed, line, lineIndex, diagnostics, options);
}

function validateOptionValue(parsed, line, lineIndex, diagnostics, options) {
  if (!parsed.hasEquals) {
    return;
  }

  const info = getOptionMetadata(parsed.key, options.target);
  const value = parsed.value.trim();
  const equalIndex = findUnquotedEqual(line);
  const valueStart = value ? line.indexOf(value, equalIndex + 1) : equalIndex;
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
    info?.type === "boolean" &&
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

  const integerPattern = info?.minimum < 0 ? /^[+-]?\d+$/ : /^\+?\d+$/;
  if (info?.type === "integer" && !integerPattern.test(unquotedValue)) {
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

  if (info?.type === "size" && !/^\d+(?:[KMGTEP]B?|B)?$/i.test(unquotedValue)) {
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

  if (
    info?.values &&
    !info.values.some(
      (allowed) => allowed.toLowerCase() === unquotedValue.toLowerCase(),
    )
  ) {
    diagnostics.push(
      createDiagnostic(
        lineIndex,
        valueStart,
        valueEnd,
        `Option '${parsed.key}' expects one of: ${info.values.join(", ")}.`,
        vscode.DiagnosticSeverity.Warning,
        "invalid-enum",
      ),
    );
  }

  let numericValue;
  if (info?.type === "integer" && integerPattern.test(unquotedValue)) {
    numericValue = Number(unquotedValue);
  } else if (info?.type === "size") {
    const size = /^(\d+)([KMGTEP]?)(?:B)?$/i.exec(unquotedValue);
    if (size)
      numericValue =
        Number(size[1]) *
        1024 ** (size[2] ? "KMGTPE".indexOf(size[2].toUpperCase()) + 1 : 0);
  }
  if (
    numericValue !== undefined &&
    (numericValue < info.minimum || numericValue > info.maximum)
  ) {
    diagnostics.push(
      createDiagnostic(
        lineIndex,
        valueStart,
        valueEnd,
        `Option '${parsed.key}' expects a value ${info.minimum !== undefined ? `>= ${info.minimum}` : ""}${info.minimum !== undefined && info.maximum !== undefined ? " and " : ""}${info.maximum !== undefined ? `<= ${info.maximum}` : ""}${info.type === "size" ? " bytes" : ""}.`,
        vscode.DiagnosticSeverity.Warning,
        "out-of-range",
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

  if (main.startsWith("[")) {
    return { type: "unknown", text: trimmed, comment: split.comment };
  }

  const equalIndex = findUnquotedEqual(main);
  if ((equalIndex < 0 ? main : main.slice(0, equalIndex)).includes("]")) {
    return { type: "unknown", text: trimmed, comment: split.comment };
  }
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

    if ((character === "'" || character === '"') && !isEscaped(text, index)) {
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

    if ((character === "'" || character === '"') && !isEscaped(text, index)) {
      quote = quote === character ? "" : quote || character;
      continue;
    }

    if (!quote && character === "=") {
      return index;
    }
  }

  return -1;
}

function isEscaped(text, index) {
  let backslashes = 0;
  for (
    let cursor = index - 1;
    cursor >= 0 && text[cursor] === "\\";
    cursor -= 1
  ) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
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
  code,
) {
  const start = Math.max(0, startCharacter);
  const end = Math.max(start + 1, endCharacter);
  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(lineIndex, start, lineIndex, end),
    message,
    severity,
  );
  diagnostic.source = "mysql-cnf";
  diagnostic.code = code;
  return diagnostic;
}

module.exports = {
  activate,
  deactivate,
  formatText,
  getHoverTarget,
  lintDocument,
  parseLine,
  provideMysqlCnfHover,
};
