import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  a2uiOperationsSchema,
  FACILITY_CATALOG_ID,
  aggregateRows,
  composeResultSchema,
  composeResultToolSchema,
  composeResultJsonSchema,
  groupRows,
  validateResultComposition,
  validateTableFields,
} from "../packages/contracts/dist/index.js";
import { FacilityRepository } from "../apps/facility-service/dist/repository.js";
import {
  executeHistorianSqlInWorker,
  HistorianQueryService,
} from "../apps/facility-service/dist/historian-query.js";

const directory = mkdtempSync(join(tmpdir(), "packt-a2ui-test-"));
const path = join(directory, "facility.sqlite");
const repository = new FacilityRepository(path);
repository.initialize();
after(() => {
  repository.close();
  rmSync(directory, { recursive: true });
});

test("A2UI contracts validate surfaces and table data bindings", () => {
  const surfaceId = randomUUID();
  const components = [
    { id: "root", component: "Text", text: "Room description" },
  ];
  const operations = [
    {
      version: "v0.9",
      createSurface: { surfaceId, catalogId: FACILITY_CATALOG_ID },
    },
    { version: "v0.9", updateComponents: { surfaceId, components } },
  ];
  assert.deepEqual(a2uiOperationsSchema.parse(operations), operations);
  const mismatched = structuredClone(operations);
  mismatched[1].updateComponents.surfaceId = randomUUID();
  assert.equal(a2uiOperationsSchema.safeParse(mismatched).success, false);
  for (const invalid of [
    undefined,
    [null],
    operations.slice(1),
    [{ ...operations[0], version: "v0.8" }, operations[1]],
  ]) {
    assert.equal(a2uiOperationsSchema.safeParse(invalid).success, false);
  }
  const table = structuredClone(operations);
  table[1].updateComponents.components = [
    { id: "root", component: "Table", dataset: { path: "dataset" } },
  ];
  assert.equal(
    a2uiOperationsSchema.safeParse(table).success,
    false,
    "Tables need query data in the operations",
  );
});
const sql =
  "SELECT * FROM historian_readings WHERE room_name = 'Cooling room' AND metric_name = 'Air temperature' ORDER BY recorded_at";
const review = {
  approved: true,
  summary: "Test-only fixture review",
  concerns: [],
};

test("complete datasets and nested aggregates agree with independent SQLite calculations beyond the first page", async () => {
  const service = new HistorianQueryService(path);
  const result = await service.execute({
    question: "Group air temperature by manager",
    sql,
    explanation: "All matching readings",
    review,
  });
  assert.equal(result.status, "executed", JSON.stringify(result));
  assert.ok(result.rowCount > 200);
  assert.equal(
    result.entries.length,
    0,
    "The legacy entries field stays empty; execution carries rows in data",
  );
  const dataset = result.data;
  assert.equal(dataset.rows.length, result.rowCount);
  const expectedDb = new DatabaseSync(path, { readOnly: true });
  const expected = expectedDb
    .prepare(
      "SELECT shift_manager_name, AVG(numeric_value) AS average, COUNT(*) AS count, SUM(condition = 'warning') AS warnings FROM historian_readings WHERE room_name = 'Cooling room' AND metric_name = 'Air temperature' GROUP BY shift_manager_name",
    )
    .all();
  expectedDb.close();
  const groups = groupRows(dataset.rows, ["room_name", "shift_manager_name"]);
  assert.equal(groups.length, 1);
  for (const group of groups[0].children) {
    const expectedGroup = expected.find(
      (row) => row.shift_manager_name === group.label,
    );
    assert.equal(group.rows.length, expectedGroup.count);
    assert.ok(
      Math.abs(
        aggregateRows(group.rows, {
          label: "Average",
          operation: "average",
          field: "numeric_value",
        }) - expectedGroup.average,
      ) < 1e-9,
    );
    assert.equal(
      aggregateRows(group.rows, {
        label: "Warnings",
        operation: "count",
        field: "condition",
        equals: "warning",
      }),
      expectedGroup.warnings,
    );
  }
  assert.equal(
    (
      await service.execute({
        question: "Unreviewed",
        sql,
        explanation: "",
        review: { ...review, approved: false },
      })
    ).status,
    "rejected",
  );
});

test("SQL aggregate columns and empty results retain an available column schema", async () => {
  const result = await executeHistorianSqlInWorker(
    path,
    "SELECT room_name, AVG(numeric_value) AS average_temperature, COUNT(*) AS reading_count FROM historian_readings WHERE metric_name = 'Air temperature' GROUP BY room_name",
  );
  assert.equal(result.rows.length, 2);
  assert.equal(
    result.columns.find((column) => column.key === "average_temperature").type,
    "number",
  );
  const empty = await executeHistorianSqlInWorker(
    path,
    "SELECT * FROM historian_readings WHERE room_name = 'No such room'",
  );
  assert.equal(empty.rows.length, 0);
  assert.ok(empty.columns.some((column) => column.key === "recorded_at"));
});

test("read-only boundary rejects mutations, direct tables, oversized output and unknown functions", async () => {
  for (const query of [
    "DELETE FROM metric_readings",
    "SELECT * FROM metric_readings",
    "SELECT * FROM historian_readings; SELECT * FROM historian_readings",
    "SELECT randomblob(50) AS blob FROM historian_readings",
    "SELECT printf('%3000s','x') AS text FROM historian_readings LIMIT 1",
    "SELECT a.reading_id FROM historian_readings a CROSS JOIN historian_readings b LIMIT 50001",
  ]) {
    await assert.rejects(executeHistorianSqlInWorker(path, query));
  }
  await assert.rejects(
    executeHistorianSqlInWorker(path, sql, 1),
    /execution limit/,
  );
});

test("unknown fields and nonnumeric aggregates are rejected; groups distinguish null and literal labels", () => {
  const data = { columns: [{ key: "condition", type: "text" }], rows: [] };
  assert.throws(
    () => validateTableFields(data, { columns: [{ field: "invented" }] }),
    /unavailable/,
  );
  assert.throws(
    () =>
      validateTableFields(data, {
        aggregates: [{ operation: "average", field: "condition" }],
      }),
    /numeric/,
  );
  assert.throws(
    () =>
      validateTableFields(data, {
        aggregates: [{ operation: "count", equals: "warning" }],
      }),
    /needs a column/,
  );
  assert.equal(
    groupRows([{ condition: null }, { condition: "No value" }], ["condition"])
      .length,
    2,
  );
  assert.equal(
    aggregateRows([], { operation: "average", field: "value" }),
    null,
  );
  assert.equal(aggregateRows([], { operation: "count" }), 0);
  assert.equal(
    aggregateRows(
      [
        { numeric_value: 1, unit: "°C", metric_name: "Air temperature" },
        { numeric_value: 2, unit: "%", metric_name: "Humidity" },
      ],
      { operation: "average", field: "numeric_value" },
    ),
    null,
  );
});

test("A2UI composition accepts different structures and rejects unknown components, missing children and cycles", () => {
  const section = {
    id: "root",
    component: "Card",
    title: "Investigation",
    children: [],
  };
  assert.doesNotThrow(() => validateResultComposition([section]));
  assert.doesNotThrow(() =>
    validateResultComposition([
      { ...section, children: ["room"] },
      { ...section, id: "room" },
    ]),
  );
  assert.throws(
    () => validateResultComposition([{ ...section, children: ["missing"] }]),
    /missing|not found|does not exist/i,
  );
  assert.throws(
    () => validateResultComposition([{ ...section, children: ["root"] }]),
    /cycle/,
  );
  assert.throws(
    () => validateResultComposition([section, section]),
    /unique|duplicate/i,
  );
  assert.equal(
    composeResultSchema.safeParse({
      components: [{ id: "root", component: "Script", code: "alert(1)" }],
    }).success,
    false,
  );
});

test("the model-facing schema preserves every catalogue property across Zod versions", () => {
  const input = {
    components: [
      {
        id: "root",
        component: "Card",
        title: "Overview",
        children: ["summary", "table"],
      },
      {
        id: "summary",
        component: "Text",
        text: "These readings come from the query result.",
      },
      {
        id: "table",
        component: "Table",

        columns: [{ field: "recorded_at", label: "Time" }],
        groupBy: ["shift_manager_name"],
        aggregates: [
          {
            label: "Warnings",
            operation: "count",
            field: "condition",
            equals: "warning",
          },
        ],
        showDetails: true,
        expanded: false,
      },
    ],
  };
  assert.deepEqual(composeResultToolSchema.parse(input), input);
  assert.equal(
    composeResultToolSchema.safeParse({
      components: [{ id: "root", component: "Card" }],
    }).success,
    false,
  );
  const advertised = JSON.stringify(composeResultJsonSchema);
  for (const property of [
    "children",
    "groupBy",
    "aggregates",
    "showDetails",
    "columns",
  ])
    assert.ok(advertised.includes(property));
});

test("the existing human decision boundary still rejects, approves and deduplicates alarm actions", () => {
  const proposal = {
    metricId: "cooling-air-temperature",
    metricName: "Air temperature",
    reason: "Milestone 8 regression test",
  };
  const rejected = {
    correlationId: randomUUID(),
    proposal,
    decision: "rejected",
    operatorId: "night-reception",
  };
  assert.equal(
    repository.decideAlarmApproval(rejected).outcome,
    "not-executed",
  );
  const approved = {
    ...rejected,
    correlationId: randomUUID(),
    decision: "approved",
  };
  const record = repository.decideAlarmApproval(approved);
  assert.equal(record.outcome, "executed");
  assert.deepEqual(repository.decideAlarmApproval(approved), record);
  assert.throws(
    () => repository.decideAlarmApproval({ ...approved, decision: "rejected" }),
    /correlation ID/,
  );
  assert.equal(repository.getAlarmApprovalAudit(50).entries.length, 2);
});

test("deterministic preparation enforces SQL rules without executing the query", async () => {
  const service = new HistorianQueryService(path);
  assert.equal((await service.validate(sql)).approved, true);
  for (const invalid of [
    "DELETE FROM metric_readings",
    "SELECT * FROM metric_readings",
    "SELECT randomblob(5) AS blob FROM historian_readings",
    "SELECT missing_column FROM historian_readings",
    "SELECT * FROM historian_readings; SELECT * FROM historian_readings",
  ]) {
    assert.equal((await service.validate(invalid)).approved, false, invalid);
  }
  const failsOnlyWhenExecuted =
    "SELECT abs(CASE WHEN reading_id > 0 THEN -9223372036854775808 ELSE 0 END) AS numeric_value FROM historian_readings LIMIT 1";
  assert.equal((await service.validate(failsOnlyWhenExecuted)).approved, true);
  await assert.rejects(
    executeHistorianSqlInWorker(path, failsOnlyWhenExecuted),
    /integer overflow/,
  );
});

test("room overview queries return the stored descriptions through the reviewed query surface", async () => {
  const result = await executeHistorianSqlInWorker(
    path,
    "SELECT DISTINCT room_name, room_description FROM historian_readings ORDER BY room_name",
  );
  assert.equal(result.rows.length, 2);
  assert.ok(
    result.rows.every(
      (row) =>
        typeof row.room_description === "string" &&
        row.room_description.length > 10,
    ),
  );
});
