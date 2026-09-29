import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  executeHistorianSql,
  HistorianPolicyError,
} from "../dist/historian-query.js";

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "historian-policy-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, "fixture.sqlite");
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE metrics (reading_id INTEGER, recorded_at TEXT, room_id TEXT, room_name TEXT,
      metric_id TEXT, metric_name TEXT, unit TEXT, numeric_value REAL, text_value TEXT,
      shift_manager_name TEXT, condition TEXT);
    INSERT INTO metrics VALUES (1, '2026-09-29T00:00:00Z', 'cooling', 'Cooling room',
      'temperature', 'Air temperature', '°C', 18, NULL, 'Pat', 'normal');
    CREATE VIEW historian_readings AS SELECT * FROM metrics;
  `);
  db.close();
  return path;
}

test("execution still accepts complete readings through the allowed view", (t) => {
  const result = executeHistorianSql(
    fixture(t),
    "SELECT * FROM historian_readings",
  );
  assert.equal(result.rowCount, 1);
  assert.equal(result.entries[0].numericValue, 18);
});

test("execution repeats preflight and leaves the database unchanged", (t) => {
  const path = fixture(t);
  for (const sql of [
    "DROP TABLE metrics",
    "DELETE FROM metrics",
    "UPDATE metrics SET numeric_value = 0",
    "INSERT INTO metrics VALUES (1)",
    "SELECT * FROM historian_readings; SELECT * FROM historian_readings",
  ]) {
    assert.throws(() => executeHistorianSql(path, sql), HistorianPolicyError);
  }
  assert.equal(
    executeHistorianSql(path, "SELECT * FROM historian_readings").entries[0]
      .numericValue,
    18,
  );
});

test("database authorizer rejects direct table access and disallowed functions", (t) => {
  const path = fixture(t);
  for (const sql of [
    "SELECT * FROM metrics",
    "SELECT AVG(numeric_value) FROM historian_readings",
  ]) {
    assert.throws(() => executeHistorianSql(path, sql), HistorianPolicyError);
  }
});

test("execution rejects an incomplete result shape even after lexical preflight", (t) => {
  assert.throws(
    () =>
      executeHistorianSql(
        fixture(t),
        "SELECT numeric_value FROM historian_readings",
      ),
    (error) =>
      error instanceof HistorianPolicyError &&
      error.code === "UNSUPPORTED_RESULT_SHAPE",
  );
});
