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

const SECTION_HOVER_INFO = new Map([
  [
    "client",
    {
      description:
        "Options read by MySQL client programs such as mysql, mysqladmin, and mysqldump.",
    },
  ],
  [
    "mysql",
    {
      description: "Options read by the mysql command-line client.",
    },
  ],
  [
    "mysqld",
    {
      description: "Options read by the MySQL server process.",
    },
  ],
  [
    "mysqld_safe",
    {
      description:
        "Options read by the mysqld_safe wrapper before it starts the server.",
    },
  ],
  [
    "mysqldump",
    {
      description: "Options read by the mysqldump backup client.",
    },
  ],
  [
    "isamchk",
    {
      description: "Options read by the MyISAM table checking utility.",
    },
  ],
  [
    "server",
    {
      description:
        "Options shared by server programs that read MySQL option files.",
    },
  ],
  [
    "client-server",
    {
      description: "Options shared by MySQL client and server programs.",
    },
  ],
]);

const OPTION_HOVER_INFO = new Map([
  [
    "basedir",
    {
      description: "Base directory for the MySQL installation.",
      valueType: "path",
    },
  ],
  [
    "binlog-expire-logs-seconds",
    {
      description:
        "Number of seconds before binary log files are eligible for automatic removal.",
      valueType: "integer",
    },
  ],
  [
    "binlog-format",
    {
      description:
        "Binary logging format used for replication and point-in-time recovery.",
      valueType: "ROW, STATEMENT, or MIXED",
    },
  ],
  [
    "binlog-ignore-db",
    {
      description:
        "Database name to ignore when writing binary log events. This option may be repeated.",
      valueType: "database name",
    },
  ],
  [
    "binlog-row-image",
    {
      description:
        "Controls how much row data is written for row-based binary logging.",
      valueType: "FULL, MINIMAL, or NOBLOB",
    },
  ],
  [
    "character-set-server",
    {
      description:
        "Default character set used by the server for new schemas and connections.",
      valueType: "character set name",
    },
  ],
  [
    "collation-server",
    {
      description: "Default collation used with the server character set.",
      valueType: "collation name",
    },
  ],
  [
    "datadir",
    {
      description: "Directory where the server stores database files.",
      valueType: "path",
    },
  ],
  [
    "default-character-set",
    {
      description: "Default character set used by a client program.",
      valueType: "character set name",
    },
  ],
  [
    "default-storage-engine",
    {
      description: "Default storage engine for newly created tables.",
      valueType: "storage engine name",
    },
  ],
  [
    "default-tmp-storage-engine",
    {
      description:
        "Default storage engine for internal or explicit temporary tables.",
      valueType: "storage engine name",
    },
  ],
  [
    "init-connect",
    {
      description:
        "SQL statement executed for each new client connection, except users with elevated privileges.",
      valueType: "SQL string",
    },
  ],
  [
    "innodb-adaptive-hash-index",
    {
      description: "Enables or disables the InnoDB adaptive hash index.",
      valueType: "boolean",
    },
  ],
  [
    "innodb-autoinc-lock-mode",
    {
      description: "Locking mode used by InnoDB for auto-increment values.",
      valueType: "integer",
    },
  ],
  [
    "innodb-buffer-pool-instances",
    {
      description: "Number of regions used to divide the InnoDB buffer pool.",
      valueType: "integer",
    },
  ],
  [
    "innodb-buffer-pool-size",
    {
      description:
        "Amount of memory reserved for caching InnoDB table and index data.",
      valueType: "size",
    },
  ],
  [
    "innodb-change-buffer-max-size",
    {
      description:
        "Maximum percentage of the buffer pool that InnoDB may use for the change buffer.",
      valueType: "integer",
    },
  ],
  [
    "innodb-change-buffering",
    {
      description:
        "Controls which secondary index changes InnoDB buffers before merging into indexes.",
      valueType: "mode",
    },
  ],
  [
    "innodb-checksum-algorithm",
    {
      description: "Checksum algorithm used for InnoDB tablespace pages.",
      valueType: "algorithm name",
    },
  ],
  [
    "innodb-file-per-table",
    {
      description:
        "Stores each InnoDB table in its own tablespace file when enabled.",
      valueType: "boolean",
    },
  ],
  [
    "innodb-flush-log-at-trx-commit",
    {
      description:
        "Controls how often InnoDB flushes redo logs at transaction commit.",
      valueType: "integer",
    },
  ],
  [
    "innodb-flush-method",
    {
      description:
        "I/O method InnoDB uses to open and flush data files and log files.",
      valueType: "method name",
    },
  ],
  [
    "innodb-io-capacity",
    {
      description:
        "Approximate number of I/O operations per second available to InnoDB background tasks.",
      valueType: "integer",
    },
  ],
  [
    "innodb-io-capacity-max",
    {
      description:
        "Upper I/O capacity limit InnoDB can use during bursts of background work.",
      valueType: "integer",
    },
  ],
  [
    "innodb-log-buffer-size",
    {
      description:
        "Memory used to buffer InnoDB redo log records before they are written to disk.",
      valueType: "size",
    },
  ],
  [
    "innodb-log-file-size",
    { description: "Size of each InnoDB redo log file.", valueType: "size" },
  ],
  [
    "innodb-lru-scan-depth",
    {
      description:
        "Number of pages scanned by each buffer pool instance during page cleaner work.",
      valueType: "integer",
    },
  ],
  [
    "innodb-max-undo-log-size",
    {
      description:
        "Threshold size for truncating undo tablespaces when undo log truncation is enabled.",
      valueType: "size",
    },
  ],
  [
    "innodb-monitor-enable",
    {
      description: "Enables one or more InnoDB monitor counters.",
      valueType: "counter name or all",
    },
  ],
  [
    "innodb-open-files",
    {
      description:
        "Maximum number of files InnoDB can keep open at the same time.",
      valueType: "integer",
    },
  ],
  [
    "innodb-page-cleaners",
    {
      description: "Number of page cleaner threads used by InnoDB.",
      valueType: "integer",
    },
  ],
  [
    "innodb-purge-threads",
    {
      description: "Number of background purge threads used by InnoDB.",
      valueType: "integer",
    },
  ],
  [
    "innodb-stats-auto-recalc",
    {
      description:
        "Automatically recalculates persistent InnoDB statistics after table changes.",
      valueType: "boolean",
    },
  ],
  [
    "innodb-stats-on-metadata",
    {
      description:
        "Controls whether InnoDB refreshes statistics during metadata queries.",
      valueType: "boolean",
    },
  ],
  [
    "innodb-stats-persistent",
    {
      description:
        "Stores InnoDB optimizer statistics persistently across server restarts.",
      valueType: "boolean",
    },
  ],
  [
    "innodb-stats-persistent-sample-pages",
    {
      description:
        "Number of index pages sampled when calculating persistent InnoDB statistics.",
      valueType: "integer",
    },
  ],
  [
    "innodb-sync-spin-loops",
    {
      description:
        "Number of spin waits before InnoDB threads suspend while waiting for mutexes.",
      valueType: "integer",
    },
  ],
  [
    "innodb-thread-concurrency",
    {
      description:
        "Limit for the number of threads allowed to enter InnoDB concurrently.",
      valueType: "integer",
    },
  ],
  [
    "innodb-undo-log-truncate",
    {
      description:
        "Allows InnoDB undo tablespaces to be truncated when they grow past the configured limit.",
      valueType: "boolean",
    },
  ],
  [
    "innodb-use-native-aio",
    {
      description:
        "Uses native asynchronous I/O support when the operating system provides it.",
      valueType: "boolean",
    },
  ],
  [
    "jemalloc-profiling",
    {
      description:
        "Enables allocator profiling when the server is built with jemalloc support.",
      valueType: "boolean",
    },
  ],
  [
    "key-buffer",
    {
      description:
        "Memory used for MyISAM index blocks by utilities such as isamchk.",
      valueType: "size",
    },
  ],
  [
    "key-buffer-size",
    {
      description: "Memory used for MyISAM index blocks by the server.",
      valueType: "size",
    },
  ],
  [
    "key-cache-division-limit",
    {
      description:
        "Percentage split between warm and hot MyISAM key cache blocks.",
      valueType: "integer",
    },
  ],
  [
    "log-bin",
    {
      description: "Base name or path for binary log files.",
      valueType: "path or file base name",
    },
  ],
  [
    "log-error",
    { description: "Path to the server error log file.", valueType: "path" },
  ],
  [
    "log-error-verbosity",
    {
      description: "Amount of detail written to the error log.",
      valueType: "integer",
    },
  ],
  [
    "log-output",
    {
      description: "Destination for general and slow query logs.",
      valueType: "FILE, TABLE, or NONE",
    },
  ],
  [
    "log-query-errors",
    {
      description:
        "Controls logging of statement errors in compatible MySQL or MariaDB variants.",
      valueType: "mode",
    },
  ],
  [
    "log-replica-updates",
    {
      description:
        "Writes replicated updates received by this server to its own binary log.",
      valueType: "boolean",
    },
  ],
  [
    "log-slow-admin-statements",
    {
      description:
        "Includes slow administrative statements in the slow query log.",
      valueType: "boolean",
    },
  ],
  [
    "log-slow-rate-limit",
    {
      description:
        "Limits how many matching slow queries are written to the slow query log.",
      valueType: "integer",
    },
  ],
  [
    "log-slow-rate-type",
    {
      description: "Chooses how slow query rate limiting is applied.",
      valueType: "mode",
    },
  ],
  [
    "log-slow-replica-statements",
    {
      description: "Includes slow replicated statements in the slow query log.",
      valueType: "boolean",
    },
  ],
  [
    "log-slow-verbosity",
    {
      description: "Controls extra detail included in slow query log entries.",
      valueType: "mode list",
    },
  ],
  [
    "long-query-time",
    {
      description: "Minimum execution time before a query is considered slow.",
      valueType: "number of seconds",
    },
  ],
  [
    "max-allowed-packet",
    {
      description: "Maximum packet size accepted by the server or client.",
      valueType: "size",
    },
  ],
  [
    "max-binlog-size",
    {
      description:
        "Maximum size of a binary log file before the server rotates to a new file.",
      valueType: "size",
    },
  ],
  [
    "max-connections",
    {
      description:
        "Maximum number of simultaneous client connections allowed by the server.",
      valueType: "integer",
    },
  ],
  [
    "max-heap-table-size",
    {
      description: "Maximum size for user-created MEMORY tables.",
      valueType: "size",
    },
  ],
  [
    "myisam-sort-buffer-size",
    {
      description: "Buffer size used while sorting MyISAM indexes.",
      valueType: "size",
    },
  ],
  [
    "mysql-native-password",
    {
      description:
        "Enables the mysql_native_password authentication plugin where supported.",
      valueType: "boolean",
    },
  ],
  [
    "nice",
    {
      description:
        "Scheduling priority adjustment used when starting the server wrapper.",
      valueType: "integer",
    },
  ],
  [
    "open-files-limit",
    {
      description:
        "Requested operating system file descriptor limit for the server process.",
      valueType: "integer",
    },
  ],
  [
    "performance-schema",
    {
      description: "Enables or disables Performance Schema instrumentation.",
      valueType: "boolean",
    },
  ],
  [
    "performance-schema-instrument",
    {
      description:
        "Enables, disables, or configures a Performance Schema instrument. This option may be repeated.",
      valueType: "instrument pattern",
    },
  ],
  [
    "pid-file",
    {
      description: "Path to the file where the server writes its process ID.",
      valueType: "path",
    },
  ],
  [
    "port",
    {
      description: "TCP/IP port number used by MySQL clients or the server.",
      valueType: "integer",
    },
  ],
  [
    "quick",
    {
      description:
        "Streams rows directly instead of buffering complete result sets in memory.",
      valueType: "flag",
    },
  ],
  [
    "quote-names",
    {
      description: "Quotes database, table, and column names in dump output.",
      valueType: "flag",
    },
  ],
  [
    "read-buffer-size",
    {
      description: "Per-session buffer used for sequential table scans.",
      valueType: "size",
    },
  ],
  [
    "read-rnd-buffer-size",
    {
      description:
        "Per-session buffer used after sorting rows before reading them in sorted order.",
      valueType: "size",
    },
  ],
  [
    "relay-log",
    {
      description:
        "Base name or path for relay log files used by replication replicas.",
      valueType: "path or file base name",
    },
  ],
  [
    "secure-file-priv",
    {
      description:
        "Restricts import and export operations to a specific directory.",
      valueType: "path",
    },
  ],
  [
    "server-id",
    {
      description:
        "Unique numeric identifier for this server in a replication topology.",
      valueType: "integer",
    },
  ],
  [
    "skip-external-locking",
    {
      description: "Disables external locking for MyISAM tables.",
      valueType: "flag",
    },
  ],
  [
    "skip-name-resolve",
    {
      description: "Disables DNS host name lookups for client connections.",
      valueType: "flag",
    },
  ],
  [
    "slow-query-log",
    {
      description:
        "Enables logging of queries that exceed the configured slow query threshold.",
      valueType: "boolean",
    },
  ],
  [
    "slow-query-log-always-write-time",
    {
      description:
        "Writes queries above this time even when slow log rate limiting is active.",
      valueType: "number of seconds",
    },
  ],
  [
    "slow-query-log-file",
    { description: "Path to the slow query log file.", valueType: "path" },
  ],
  [
    "slow-query-log-use-global-control",
    {
      description:
        "Controls which slow query log settings are read from global values.",
      valueType: "mode list",
    },
  ],
  [
    "socket",
    {
      description: "Unix socket path used for local MySQL connections.",
      valueType: "path",
    },
  ],
  [
    "sort-buffer-size",
    {
      description: "Per-session buffer used for sort operations.",
      valueType: "size",
    },
  ],
  [
    "sync-binlog",
    {
      description:
        "Controls how often the server synchronizes the binary log to disk.",
      valueType: "integer",
    },
  ],
  [
    "table-definition-cache",
    {
      description: "Number of table definitions the server can cache.",
      valueType: "integer",
    },
  ],
  [
    "table-open-cache",
    {
      description: "Number of open table objects the server can cache.",
      valueType: "integer",
    },
  ],
  [
    "thread-cache-size",
    {
      description:
        "Number of reusable connection threads kept in the thread cache.",
      valueType: "integer",
    },
  ],
  [
    "thread-handling",
    {
      description: "Thread model used for client connections.",
      valueType: "mode",
    },
  ],
  [
    "thread-pool-oversubscribe",
    {
      description:
        "Controls how many additional active threads may run in each thread group.",
      valueType: "integer",
    },
  ],
  [
    "thread-stack",
    {
      description: "Stack size allocated for each connection thread.",
      valueType: "size",
    },
  ],
  [
    "thread-statistics",
    {
      description:
        "Enables per-thread statistics where supported by the server variant.",
      valueType: "boolean",
    },
  ],
  [
    "tmp-table-size",
    {
      description:
        "Maximum size for internal in-memory temporary tables before they may be converted to disk tables.",
      valueType: "size",
    },
  ],
  [
    "tmpdir",
    {
      description: "Directory used for temporary files and temporary tables.",
      valueType: "path",
    },
  ],
  [
    "transaction-isolation",
    {
      description: "Default transaction isolation level for new sessions.",
      valueType: "isolation level",
    },
  ],
  [
    "user",
    {
      description:
        "Operating system user account used to run the server process.",
      valueType: "user name",
    },
  ],
  [
    "userstat",
    {
      description:
        "Enables user, client, and table statistics where supported by the server variant.",
      valueType: "boolean",
    },
  ],
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
    if (parsed.type === "option" || parsed.type === "comment") {
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

  return block.map((item) => {
    if (item.type !== "option") {
      return formatNonOptionLine(item);
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

function provideMysqlCnfHover(document, position) {
  const line = document.lineAt(position.line).text;
  const target = getHoverTarget(line, position.character);
  if (!target) {
    return undefined;
  }

  const info =
    target.type === "section"
      ? getSectionHoverInfo(target.name)
      : getOptionHoverInfo(target.name);

  if (!info) {
    return undefined;
  }

  return new vscode.Hover(
    createHoverMarkdown(target, info),
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
  const exact = SECTION_HOVER_INFO.get(normalizedSection);
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

function getOptionHoverInfo(optionName) {
  const normalizedOption = normalizeOptionName(optionName);
  const exact = OPTION_HOVER_INFO.get(normalizedOption);
  if (exact) {
    return exact;
  }

  if (normalizedOption.startsWith("performance-schema-consumer-")) {
    return {
      description:
        "Enables or disables a Performance Schema consumer that stores instrumented events.",
      valueType: "boolean",
    };
  }

  if (normalizedOption.startsWith("loose-")) {
    return {
      description:
        "MySQL option using the loose prefix, so programs that do not recognize it can ignore it instead of failing startup.",
      valueType: "option value",
    };
  }

  if (isBooleanOption(normalizedOption)) {
    return {
      description: "Boolean MySQL option.",
      valueType: "ON, OFF, 1, or 0",
    };
  }

  if (INTEGER_OPTIONS.has(normalizedOption)) {
    return {
      description: "Numeric MySQL option.",
      valueType: "integer",
    };
  }

  if (SIZE_OPTIONS.has(normalizedOption)) {
    return {
      description:
        "Size-valued MySQL option. MySQL accepts numeric values and common suffixes such as K, M, or G.",
      valueType: "size",
    };
  }

  return {
    description:
      "MySQL option. Add a matching entry to OPTION_HOVER_INFO in extension.js to show a more specific description.",
    valueType: "option value",
  };
}

function createHoverMarkdown(target, info) {
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
  getHoverTarget,
  lintDocument,
  parseLine,
  provideMysqlCnfHover,
};
