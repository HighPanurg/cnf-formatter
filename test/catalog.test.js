const assert = require("node:assert/strict");
const test = require("node:test");
const { loadExtension, document, lintOptions } = require("./helpers");
const {
  OPTION_CATALOG,
  getOptionMetadata,
  getCompatibility,
} = require("../option-catalog");
const { lintDocument } = loadExtension();

test("catalog filters client, server, utility, suffix and shared groups", () => {
  const { isOptionInSection } = require("../option-catalog");
  const port = getOptionMetadata("port");
  const buffer = getOptionMetadata("innodb-buffer-pool-size");
  assert.ok(isOptionInSection(port, "client-server"));
  assert.ok(!isOptionInSection(buffer, "client-server"));
  assert.ok(!isOptionInSection(buffer, "mysql"));
  assert.ok(isOptionInSection(buffer, "mysqld-8.4"));
  assert.ok(isOptionInSection(buffer, "custom"));
  assert.ok(isOptionInSection(getOptionMetadata("quote-names"), "mysqldump"));
  assert.ok(!isOptionInSection(getOptionMetadata("quote-names"), "mysql"));
});

function lint(option, flavor = "generic", version = "") {
  return lintDocument(document(`[mysqld]\n${option}`), {
    ...lintOptions,
    target: { flavor, version },
  });
}

test("catalog preserves metadata and supports normalized and loose names", () => {
  assert.ok(OPTION_CATALOG.size > 90);
  assert.equal(getOptionMetadata("loose_innodb_buffer_pool_size").type, "size");
  assert.equal(
    getOptionMetadata("performance_schema_consumer_events_stages_current").type,
    "boolean",
  );
  assert.equal(lint("unknown-plugin-setting=anything").length, 0);
});

test("version checks cover introduction, deprecation and removal boundaries", () => {
  assert.equal(
    lint("log-replica-updates=ON", "mysql", "8.0.25")[0].code,
    "unsupported-option",
  );
  assert.equal(lint("log-replica-updates=ON", "mysql", "8.0.26").length, 0);
  assert.equal(lint("innodb-log-file-size=64M", "mysql", "8.0.29").length, 0);
  assert.equal(
    lint("innodb-log-file-size=64M", "mysql", "8.0.30")[0].code,
    "deprecated-option",
  );
  assert.equal(lint("mysql-native-password=ON", "mysql", "8.4").length, 0);
  assert.equal(
    lint("mysql-native-password", "mysql", "9.0")[0].code,
    "removed-option",
  );
  assert.equal(
    lint("innodb-buffer-pool-instances=2", "mariadb", "10.5.1")[0].code,
    "deprecated-option",
  );
  assert.equal(
    lint("innodb-buffer-pool-instances=2", "mariadb", "10.6")[0].code,
    "removed-option",
  );
});

test("generic, unspecified and malformed versions do not invent version warnings", () => {
  for (const version of ["", "latest", "8.0.invalid"]) {
    assert.equal(lint("binlog-format=ROW", "mysql", version).length, 0);
  }
  assert.equal(lint("mysql-native-password=ON", "generic", "9.0").length, 0);
  assert.equal(
    lint("loose-mysql-native-password=ON", "mysql", "9.0").length,
    0,
  );
  assert.equal(lint("userstat=ON", "mysql")[0].code, "unsupported-option");
  assert.equal(lint("userstat=ON", "mariadb", "10.11").length, 0);
  assert.equal(
    getCompatibility(undefined, { flavor: "mysql", version: "8.4" }),
    undefined,
  );
});

test("catalog drives numeric limits, signed integers, sizes and enums", () => {
  assert.equal(lint("port=65535").length, 0);
  assert.equal(lint("port=65536")[0].code, "out-of-range");
  assert.equal(lint("server-id=4294967296")[0].code, "out-of-range");
  assert.equal(lint("nice=-10").length, 0);
  assert.equal(lint("nice=-21")[0].code, "out-of-range");
  assert.match(lint("max-connections=many")[0].message, /integer/);
  assert.equal(lint("binlog-format=row").length, 0);
  assert.equal(lint("binlog-format=invalid")[0].code, "invalid-enum");
  assert.equal(
    lint("innodb-redo-log-capacity=4M", "mysql", "8.4")[0].code,
    "out-of-range",
  );
  assert.equal(lint("innodb-redo-log-capacity=1G", "mysql", "8.4").length, 0);
  assert.equal(
    lint("innodb-flush-log-at-trx-commit=3", "mysql")[0].code,
    "invalid-enum",
  );
  assert.equal(lint("innodb-flush-log-at-trx-commit=3", "mariadb").length, 0);
});

test("value diagnostics point after equals even when the value occurs in the key", () => {
  const diagnostic = lint("port=port")[0];
  assert.equal(diagnostic.range.start.character, 5);
  assert.equal(diagnostic.range.end.character, 9);
  const empty = lint("port=")[0];
  assert.equal(empty.range.start.character, 4);
});
