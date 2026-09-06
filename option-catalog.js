const SECTION_CATALOG = new Map([
  [
    "client",
    {
      description:
        "Options read by MySQL client programs such as mysql, mysqladmin, and mysqldump.",
    },
  ],
  [
    "client-server",
    {
      description: "Options shared by MySQL client and server programs.",
    },
  ],
  [
    "embedded",
    {
      description: "Options read by embedded.",
    },
  ],
  [
    "isamchk",
    {
      description: "Options read by the MyISAM table checking utility.",
    },
  ],
  [
    "mariadb",
    {
      description: "Options read by mariadb.",
    },
  ],
  [
    "myisamchk",
    {
      description: "Options read by myisamchk.",
    },
  ],
  [
    "mysql",
    {
      description: "Options read by the mysql command-line client.",
    },
  ],
  [
    "mysql.server",
    {
      description: "Options read by mysql.server.",
    },
  ],
  [
    "mysqladmin",
    {
      description: "Options read by mysqladmin.",
    },
  ],
  [
    "mysqlbinlog",
    {
      description: "Options read by mysqlbinlog.",
    },
  ],
  [
    "mysqlcheck",
    {
      description: "Options read by mysqlcheck.",
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
    "mysqlimport",
    {
      description: "Options read by mysqlimport.",
    },
  ],
  [
    "mysqlpump",
    {
      description: "Options read by mysqlpump.",
    },
  ],
  [
    "mysqlshow",
    {
      description: "Options read by mysqlshow.",
    },
  ],
  [
    "mysqlslap",
    {
      description: "Options read by mysqlslap.",
    },
  ],
  [
    "mysqltest",
    {
      description: "Options read by mysqltest.",
    },
  ],
  [
    "server",
    {
      description:
        "Options shared by server programs that read MySQL option files.",
    },
  ],
]);

const OPTION_CATALOG = new Map([
  [
    "basedir",
    {
      description: "Base directory for the MySQL installation.",
      valueType: "path",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "binlog-do-db",
    {
      description: "MySQL option 'binlog-do-db'.",
      valueType: "option value",
      type: "string",
      repeatable: true,
    },
  ],
  [
    "binlog-expire-logs-seconds",
    {
      description:
        "Number of seconds before binary log files are eligible for automatic removal.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "binlog-format",
    {
      values: ["ROW", "STATEMENT", "MIXED"],
      versions: { mysql: { deprecated: "8.0.34" } },
      documentation: {
        mysql:
          "https://dev.mysql.com/doc/refman/8.0/en/replication-options-binary-log.html#sysvar_binlog_format",
      },
      description:
        "Binary logging format used for replication and point-in-time recovery.",
      valueType: "ROW, STATEMENT, or MIXED",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "binlog-ignore-db",
    {
      description:
        "Database name to ignore when writing binary log events. This option may be repeated.",
      valueType: "database name",
      type: "string",
      repeatable: true,
    },
  ],
  [
    "binlog-row-image",
    {
      description:
        "Controls how much row data is written for row-based binary logging.",
      valueType: "FULL, MINIMAL, or NOBLOB",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "character-set-server",
    {
      description:
        "Default character set used by the server for new schemas and connections.",
      valueType: "character set name",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "collation-server",
    {
      description: "Default collation used with the server character set.",
      valueType: "collation name",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "datadir",
    {
      description: "Directory where the server stores database files.",
      valueType: "path",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "default-character-set",
    {
      groups: ["client"],
      description: "Default character set used by a client program.",
      valueType: "character set name",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "default-storage-engine",
    {
      description: "Default storage engine for newly created tables.",
      valueType: "storage engine name",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "default-tmp-storage-engine",
    {
      description:
        "Default storage engine for internal or explicit temporary tables.",
      valueType: "storage engine name",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "ignore-db-dir",
    {
      description: "MySQL option 'ignore-db-dir'.",
      valueType: "option value",
      type: "string",
      repeatable: true,
    },
  ],
  [
    "init-connect",
    {
      description:
        "SQL statement executed for each new client connection, except users with elevated privileges.",
      valueType: "SQL string",
      type: "string",
      repeatable: true,
    },
  ],
  [
    "innodb-adaptive-hash-index",
    {
      description: "Enables or disables the InnoDB adaptive hash index.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "innodb-autoinc-lock-mode",
    {
      minimum: 0,
      maximum: 2,
      description: "Locking mode used by InnoDB for auto-increment values.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "innodb-buffer-pool-instances",
    {
      versions: { mariadb: { deprecated: "10.5.1", removed: "10.6.0" } },
      documentation: {
        mariadb:
          "https://mariadb.com/kb/en/innodb-system-variables/#innodb_buffer_pool_instances",
      },
      description: "Number of regions used to divide the InnoDB buffer pool.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "innodb-buffer-pool-size",
    {
      description:
        "Amount of memory reserved for caching InnoDB table and index data.",
      valueType: "size",
      type: "size",
      repeatable: false,
    },
  ],
  [
    "innodb-change-buffer-max-size",
    {
      description:
        "Maximum percentage of the buffer pool that InnoDB may use for the change buffer.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "innodb-change-buffering",
    {
      description:
        "Controls which secondary index changes InnoDB buffers before merging into indexes.",
      valueType: "mode",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "innodb-checksum-algorithm",
    {
      description: "Checksum algorithm used for InnoDB tablespace pages.",
      valueType: "algorithm name",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "innodb-file-per-table",
    {
      description:
        "Stores each InnoDB table in its own tablespace file when enabled.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "innodb-flush-log-at-trx-commit",
    {
      versions: { mysql: { values: ["0", "1", "2"] } },
      description:
        "Controls how often InnoDB flushes redo logs at transaction commit.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "innodb-flush-method",
    {
      description:
        "I/O method InnoDB uses to open and flush data files and log files.",
      valueType: "method name",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "innodb-io-capacity",
    {
      description:
        "Approximate number of I/O operations per second available to InnoDB background tasks.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "innodb-io-capacity-max",
    {
      description:
        "Upper I/O capacity limit InnoDB can use during bursts of background work.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "innodb-log-buffer-size",
    {
      description:
        "Memory used to buffer InnoDB redo log records before they are written to disk.",
      valueType: "size",
      type: "size",
      repeatable: false,
    },
  ],
  [
    "innodb-log-file-size",
    {
      versions: {
        mysql: {
          deprecated: "8.0.30",
          replacement:
            "innodb-redo-log-capacity (total capacity, not per-file size)",
        },
      },
      documentation: {
        mysql:
          "https://dev.mysql.com/doc/refman/8.0/en/innodb-parameters.html#sysvar_innodb_log_file_size",
      },
      description: "Size of each InnoDB redo log file.",
      valueType: "size",
      type: "size",
      repeatable: false,
    },
  ],
  [
    "innodb-lru-scan-depth",
    {
      description:
        "Number of pages scanned by each buffer pool instance during page cleaner work.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "innodb-max-undo-log-size",
    {
      description:
        "Threshold size for truncating undo tablespaces when undo log truncation is enabled.",
      valueType: "size",
      type: "size",
      repeatable: false,
    },
  ],
  [
    "innodb-monitor-enable",
    {
      description: "Enables one or more InnoDB monitor counters.",
      valueType: "counter name or all",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "innodb-open-files",
    {
      description:
        "Maximum number of files InnoDB can keep open at the same time.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "innodb-page-cleaners",
    {
      description: "Number of page cleaner threads used by InnoDB.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "innodb-purge-threads",
    {
      description: "Number of background purge threads used by InnoDB.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "innodb-stats-auto-recalc",
    {
      description:
        "Automatically recalculates persistent InnoDB statistics after table changes.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "innodb-stats-on-metadata",
    {
      description:
        "Controls whether InnoDB refreshes statistics during metadata queries.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "innodb-stats-persistent",
    {
      description:
        "Stores InnoDB optimizer statistics persistently across server restarts.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "innodb-stats-persistent-sample-pages",
    {
      description:
        "Number of index pages sampled when calculating persistent InnoDB statistics.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "innodb-sync-spin-loops",
    {
      description:
        "Number of spin waits before InnoDB threads suspend while waiting for mutexes.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "innodb-thread-concurrency",
    {
      description:
        "Limit for the number of threads allowed to enter InnoDB concurrently.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "innodb-undo-log-truncate",
    {
      description:
        "Allows InnoDB undo tablespaces to be truncated when they grow past the configured limit.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "innodb-use-native-aio",
    {
      description:
        "Uses native asynchronous I/O support when the operating system provides it.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "jemalloc-profiling",
    {
      description:
        "Enables allocator profiling when the server is built with jemalloc support.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "key-buffer",
    {
      groups: ["isamchk", "myisamchk"],
      description:
        "Memory used for MyISAM index blocks by utilities such as isamchk.",
      valueType: "size",
      type: "size",
      repeatable: false,
    },
  ],
  [
    "key-buffer-size",
    {
      description: "Memory used for MyISAM index blocks by the server.",
      valueType: "size",
      type: "size",
      repeatable: false,
    },
  ],
  [
    "key-cache-division-limit",
    {
      description:
        "Percentage split between warm and hot MyISAM key cache blocks.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "log-bin",
    {
      description: "Base name or path for binary log files.",
      valueType: "path or file base name",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "log-error",
    {
      description: "Path to the server error log file.",
      valueType: "path",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "log-error-verbosity",
    {
      description: "Amount of detail written to the error log.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "log-output",
    {
      description: "Destination for general and slow query logs.",
      valueType: "FILE, TABLE, or NONE",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "log-query-errors",
    {
      description:
        "Controls logging of statement errors in compatible MySQL or MariaDB variants.",
      valueType: "mode",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "log-replica-updates",
    {
      versions: { mysql: { introduced: "8.0.26" } },
      documentation: {
        mysql:
          "https://dev.mysql.com/doc/refman/8.0/en/replication-options-binary-log.html#sysvar_log_replica_updates",
      },
      description:
        "Writes replicated updates received by this server to its own binary log.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "log-slow-admin-statements",
    {
      description:
        "Includes slow administrative statements in the slow query log.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "log-slow-rate-limit",
    {
      description:
        "Limits how many matching slow queries are written to the slow query log.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "log-slow-rate-type",
    {
      description: "Chooses how slow query rate limiting is applied.",
      valueType: "mode",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "log-slow-replica-statements",
    {
      description: "Includes slow replicated statements in the slow query log.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "log-slow-verbosity",
    {
      description: "Controls extra detail included in slow query log entries.",
      valueType: "mode list",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "long-query-time",
    {
      description: "Minimum execution time before a query is considered slow.",
      valueType: "number of seconds",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "loose-plugin-load",
    {
      description: "MySQL option 'loose-plugin-load'.",
      valueType: "option value",
      type: "string",
      repeatable: true,
    },
  ],
  [
    "max-allowed-packet",
    {
      groups: ["server", "client"],
      description: "Maximum packet size accepted by the server or client.",
      valueType: "size",
      type: "size",
      repeatable: false,
    },
  ],
  [
    "max-binlog-size",
    {
      description:
        "Maximum size of a binary log file before the server rotates to a new file.",
      valueType: "size",
      type: "size",
      repeatable: false,
    },
  ],
  [
    "max-connections",
    {
      minimum: 1,
      description:
        "Maximum number of simultaneous client connections allowed by the server.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "max-heap-table-size",
    {
      description: "Maximum size for user-created MEMORY tables.",
      valueType: "size",
      type: "size",
      repeatable: false,
    },
  ],
  [
    "myisam-sort-buffer-size",
    {
      description: "Buffer size used while sorting MyISAM indexes.",
      valueType: "size",
      type: "size",
      repeatable: false,
    },
  ],
  [
    "mysql-native-password",
    {
      vendors: ["mysql"],
      versions: { mysql: { introduced: "8.4.0", removed: "9.0.0" } },
      documentation: {
        mysql:
          "https://dev.mysql.com/doc/refman/8.4/en/native-pluggable-authentication.html",
      },
      description:
        "Enables the mysql_native_password authentication plugin where supported.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "nice",
    {
      groups: ["mysqld_safe"],
      minimum: -20,
      maximum: 19,
      description:
        "Scheduling priority adjustment used when starting the server wrapper.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "open-files-limit",
    {
      description:
        "Requested operating system file descriptor limit for the server process.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "performance-schema",
    {
      description: "Enables or disables Performance Schema instrumentation.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "performance-schema-instrument",
    {
      description:
        "Enables, disables, or configures a Performance Schema instrument. This option may be repeated.",
      valueType: "instrument pattern",
      type: "string",
      repeatable: true,
    },
  ],
  [
    "pid-file",
    {
      description: "Path to the file where the server writes its process ID.",
      valueType: "path",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "plugin-load",
    {
      description: "MySQL option 'plugin-load'.",
      valueType: "option value",
      type: "string",
      repeatable: true,
    },
  ],
  [
    "plugin-load-add",
    {
      description: "MySQL option 'plugin-load-add'.",
      valueType: "option value",
      type: "string",
      repeatable: true,
    },
  ],
  [
    "port",
    {
      groups: ["server", "client"],
      minimum: 0,
      maximum: 65535,
      description: "TCP/IP port number used by MySQL clients or the server.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "quick",
    {
      groups: ["mysql", "mysqldump"],
      description:
        "Streams rows directly instead of buffering complete result sets in memory.",
      valueType: "flag",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "quote-names",
    {
      groups: ["mysqldump"],
      description: "Quotes database, table, and column names in dump output.",
      valueType: "flag",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "read-buffer-size",
    {
      description: "Per-session buffer used for sequential table scans.",
      valueType: "size",
      type: "size",
      repeatable: false,
    },
  ],
  [
    "read-rnd-buffer-size",
    {
      description:
        "Per-session buffer used after sorting rows before reading them in sorted order.",
      valueType: "size",
      type: "size",
      repeatable: false,
    },
  ],
  [
    "relay-log",
    {
      description:
        "Base name or path for relay log files used by replication replicas.",
      valueType: "path or file base name",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "replicate-do-db",
    {
      description: "MySQL option 'replicate-do-db'.",
      valueType: "option value",
      type: "string",
      repeatable: true,
    },
  ],
  [
    "replicate-ignore-db",
    {
      description: "MySQL option 'replicate-ignore-db'.",
      valueType: "option value",
      type: "string",
      repeatable: true,
    },
  ],
  [
    "replicate-wild-do-table",
    {
      description: "MySQL option 'replicate-wild-do-table'.",
      valueType: "option value",
      type: "string",
      repeatable: true,
    },
  ],
  [
    "replicate-wild-ignore-table",
    {
      description: "MySQL option 'replicate-wild-ignore-table'.",
      valueType: "option value",
      type: "string",
      repeatable: true,
    },
  ],
  [
    "secure-file-priv",
    {
      description:
        "Restricts import and export operations to a specific directory.",
      valueType: "path",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "server-id",
    {
      minimum: 0,
      maximum: 4294967295,
      description:
        "Unique numeric identifier for this server in a replication topology.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "skip-external-locking",
    {
      description: "Disables external locking for MyISAM tables.",
      valueType: "flag",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "skip-name-resolve",
    {
      description: "Disables DNS host name lookups for client connections.",
      valueType: "flag",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "slow-query-log",
    {
      description:
        "Enables logging of queries that exceed the configured slow query threshold.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "slow-query-log-always-write-time",
    {
      description:
        "Writes queries above this time even when slow log rate limiting is active.",
      valueType: "number of seconds",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "slow-query-log-file",
    {
      description: "Path to the slow query log file.",
      valueType: "path",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "slow-query-log-use-global-control",
    {
      description:
        "Controls which slow query log settings are read from global values.",
      valueType: "mode list",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "socket",
    {
      groups: ["server", "client"],
      description: "Unix socket path used for local MySQL connections.",
      valueType: "path",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "sort-buffer-size",
    {
      description: "Per-session buffer used for sort operations.",
      valueType: "size",
      type: "size",
      repeatable: false,
    },
  ],
  [
    "sync-binlog",
    {
      description:
        "Controls how often the server synchronizes the binary log to disk.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "table-definition-cache",
    {
      description: "Number of table definitions the server can cache.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "table-open-cache",
    {
      description: "Number of open table objects the server can cache.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "thread-cache-size",
    {
      description:
        "Number of reusable connection threads kept in the thread cache.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "thread-handling",
    {
      description: "Thread model used for client connections.",
      valueType: "mode",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "thread-pool-oversubscribe",
    {
      description:
        "Controls how many additional active threads may run in each thread group.",
      valueType: "integer",
      type: "integer",
      repeatable: false,
    },
  ],
  [
    "thread-stack",
    {
      description: "Stack size allocated for each connection thread.",
      valueType: "size",
      type: "size",
      repeatable: false,
    },
  ],
  [
    "thread-statistics",
    {
      description:
        "Enables per-thread statistics where supported by the server variant.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
  [
    "tmp-table-size",
    {
      description:
        "Maximum size for internal in-memory temporary tables before they may be converted to disk tables.",
      valueType: "size",
      type: "size",
      repeatable: false,
    },
  ],
  [
    "tmpdir",
    {
      description: "Directory used for temporary files and temporary tables.",
      valueType: "path",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "transaction-isolation",
    {
      values: [
        "READ-UNCOMMITTED",
        "READ-COMMITTED",
        "REPEATABLE-READ",
        "SERIALIZABLE",
      ],
      description: "Default transaction isolation level for new sessions.",
      valueType: "isolation level",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "user",
    {
      groups: ["server", "client", "mysqld_safe"],
      description:
        "Operating system user account used to run the server process.",
      valueType: "user name",
      type: "string",
      repeatable: false,
    },
  ],
  [
    "userstat",
    {
      vendors: ["mariadb"],
      documentation: { mariadb: "https://mariadb.com/kb/en/user-statistics/" },
      description:
        "Enables user, client, and table statistics where supported by the server variant.",
      valueType: "boolean",
      type: "boolean",
      repeatable: false,
    },
  ],
]);

OPTION_CATALOG.set("innodb-redo-log-capacity", {
  description: "Total disk space available for InnoDB redo logs.",
  valueType: "size",
  type: "size",
  vendors: ["mysql"],
  versions: {
    mysql: { introduced: "8.0.30", minimum: 8388608, maximum: 549755813888 },
  },
  documentation: {
    mysql:
      "https://dev.mysql.com/doc/refman/8.0/en/innodb-parameters.html#sysvar_innodb_redo_log_capacity",
  },
});

OPTION_CATALOG.set("host", {
  description: "Host name or IP address of the database server.",
  valueType: "host name",
  type: "string",
  groups: ["client"],
});

function normalizeOptionName(name) {
  return name.trim().toLowerCase().replace(/_/g, "-");
}

function getOptionMetadata(name, target = {}) {
  const normalized = normalizeOptionName(name).replace(/^loose-/, "");
  const info = OPTION_CATALOG.get(normalized);
  if (info) return { ...info, ...info.versions?.[target.flavor] };
  if (normalized.startsWith("performance-schema-consumer-")) {
    return {
      description: "Enables or disables a Performance Schema consumer.",
      valueType: "boolean",
      type: "boolean",
    };
  }
  return undefined;
}

function compareVersions(left, right) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (difference) return Math.sign(difference);
  }
  return 0;
}

function getCompatibility(info, target = {}) {
  if (!info || !["mysql", "mariadb"].includes(target.flavor)) return undefined;
  const vendor = target.flavor === "mysql" ? "MySQL" : "MariaDB";
  if (info.vendors && !info.vendors.includes(target.flavor)) {
    return {
      code: "unsupported-option",
      message: `Not supported by ${vendor}.`,
    };
  }
  if (!/^\d+\.\d+(?:\.\d+)?$/.test(target.version || "")) return undefined;
  const rules = info.versions?.[target.flavor] || {};
  if (
    rules.introduced &&
    compareVersions(target.version, rules.introduced) < 0
  ) {
    return {
      code: "unsupported-option",
      message: `Requires ${vendor} ${rules.introduced} or later.`,
    };
  }
  if (rules.removed && compareVersions(target.version, rules.removed) >= 0) {
    return {
      code: "removed-option",
      message: `Removed in ${vendor} ${rules.removed}.`,
    };
  }
  if (
    rules.deprecated &&
    compareVersions(target.version, rules.deprecated) >= 0
  ) {
    return {
      code: "deprecated-option",
      message: `Deprecated since ${vendor} ${rules.deprecated}.${rules.replacement ? ` Consider ${rules.replacement}.` : ""}`,
    };
  }
  return undefined;
}

function getDocumentationUrl(name, info, target = {}) {
  const flavor =
    target.flavor === "mariadb"
      ? "mariadb"
      : target.flavor === "mysql"
        ? "mysql"
        : info?.vendors?.[0] || "mysql";
  return (
    info?.documentation?.[flavor] ||
    (flavor === "mariadb"
      ? "https://mariadb.com/kb/en/mariadb-server-documentation/"
      : "https://dev.mysql.com/doc/refman/8.4/en/option-files.html")
  );
}

module.exports = {
  SECTION_CATALOG,
  OPTION_CATALOG,
  normalizeOptionName,
  getOptionMetadata,
  getCompatibility,
  getDocumentationUrl,
};
