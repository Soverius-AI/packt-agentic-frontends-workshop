// Run with: node --import ./node_modules/.pnpm/node_modules/tsx/dist/loader.mjs --test scripts/test-historian-workflow.mjs
import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { createHistorianQueryWorkflow } from "../apps/agent-service/src/mastra/workflows/historian-composition/workflow.ts";
import { createQueryHistorianTool } from "../apps/agent-service/src/mastra/agents/main/tools/query-composition-tool.ts";
import {
  createResultComposerAgent,
  composeResult,
} from "../apps/agent-service/src/mastra/workflows/historian-composition/agents/result-composer-agent.ts";
import {
  queryHistorianInputSchema,
  queryHistorianOutputSchema,
  generateA2uiInputSchema,
  returnDataInputSchema,
  selectedResultSchema,
} from "../apps/agent-service/src/mastra/workflows/historian-composition/schemas.ts";

const require = createRequire(
  new URL("../apps/agent-service/package.json", import.meta.url),
);
const { Agent } = await import(
  require.resolve("@mastra/core/agent").replace(/\.cjs$/, ".js")
);

const facilityRequire = createRequire(
  new URL("../apps/facility-service/package.json", import.meta.url),
);
const runtimeRequire = createRequire(
  facilityRequire.resolve("@copilotkit/runtime/v2"),
);
const { tryParseA2UIOperations } = runtimeRequire("@ag-ui/a2ui-middleware");

test("composer transport excludes query rows and preserves optional layout fields", async () => {
  const dataset = {
    sql: "SELECT * FROM historian_readings",
    createdAt: "2026-09-15T00:00:00.000Z",
    question: "Show temperatures in a table",
    columns: [{ key: "numeric_value", label: "Temperature", type: "number" }],
    rows: Array.from({ length: 41 }, (_, index) => ({ numeric_value: index })),
    rowCount: 41,
  };
  const components = [
    {
      id: "root",
      component: "Card",
      title: "Readings",
      children: ["table"],
    },
    {
      id: "table",
      component: "Table",

      columns: [{ field: "numeric_value" }],
    },
  ];
  const requests = [];
  mock.method(globalThis, "fetch", async (_url, init) => {
    requests.push(JSON.parse(init.body));
    return Response.json({
      id: "resp_fixture",
      created_at: 0,
      model: "google/gemma-4-31b-it",
      output: [
        {
          id: "msg_fixture",
          type: "message",
          role: "assistant",
          status: "completed",
          content: [
            {
              type: "output_text",
              text: JSON.stringify({ surfaces: [{ components }] }),
              annotations: [],
            },
          ],
        },
      ],
      usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
    });
  });
  try {
    const operations = await composeResult(
      createResultComposerAgent("fixture-key", "google/gemma-4-31b-it"),
      dataset,
    );
    assert.deepEqual(
      operations[1].updateComponents.components,
      bindTables(components),
    );
    assert.deepEqual(operations[2].updateDataModel.value.dataset, dataset);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].text?.format, undefined);
    const promptText = requests[0].input
      .flatMap((message) =>
        typeof message.content === "string"
          ? [message.content]
          : (message.content ?? []).map((part) => part.text ?? ""),
      )
      .join("\n");
    assert.ok(
      promptText.includes(
        JSON.stringify({
          question: dataset.question,
          dataset: {
            columns: dataset.columns,
          },
        }),
      ),
      "Only the question and column definitions must reach the layout model",
    );
    assert.equal(
      promptText.includes(JSON.stringify(dataset.rows)),
      false,
      "Query rows must not enter the model prompt",
    );
    const instruction = promptText.split("JSON schema:\n")[1];
    assert.ok(
      instruction,
      "The original layout schema must reach the model in the prompt",
    );
    const schema = JSON.parse(instruction.split("\n")[0]);
    const table =
      schema.properties.surfaces.items.properties.components.items.anyOf.find(
        (variant) => variant.properties.component.const === "Table",
      );
    assert.equal(table.required.includes("aggregates"), false);
    assert.equal(
      table.properties.columns.items.required.includes("digits"),
      false,
    );
  } finally {
    mock.restoreAll();
  }
});

async function runCase(input, options = {}) {
  const calls = [];
  const dataset = {
    sql: "SELECT * FROM historian_readings",
    createdAt: "2026-09-15T00:00:00.000Z",
    columns: [
      {
        key: "average_temperature",
        label: "Average temperature",
        type: "number",
      },
    ],
    rows: [{ average_temperature: 18.5 }],
    rowCount: 1,
    createdAt: new Date().toISOString(),
    question: input.question,
    sql: "SELECT AVG(numeric_value) AS average_temperature FROM historian_readings WHERE metric_name = 'Air temperature'",
  };
  const review = {
    approved: !options.reject,
    summary: "Fixture review",
    concerns: [],
  };
  const { rows, question, sql, ...metadata } = dataset;
  const execution = {
    status: "executed",
    question,
    sql,
    explanation: "Fixture query",
    review,
    policyVersion: "historian-v2",
    dataset: metadata,
    data: dataset,
    entries: [],
    rowCount: 1,
    truncated: false,
    durationMs: 1,
  };
  mock.method(Agent.prototype, "generate", async function (prompt) {
    calls.push(this.id);
    if (this.id === "sql-generator")
      return { object: { sql, explanation: "Fixture query" } };
    if (this.id === "sql-reviewer") return { object: review };
    if (this.id === "result-format") {
      assert.equal(JSON.parse(prompt).question, input.question);
      if (options.formatFailure)
        throw new Error("Fixture format decision failure");
      return { object: { format: options.format ?? "data" } };
    }
    assert.equal(this.id, "result-composer");
    assert.deepEqual(JSON.parse(prompt).dataset, { columns: dataset.columns });
    assert.equal(prompt.includes("18.5"), false);
    if (options.compositionFailure)
      throw new Error("Fixture composition failure");
    return {
      object: {
        surfaces: [
          {
            components: [
              {
                id: "root",
                component: "Card",
                title: "Temperature",
                children: ["table"],
              },
              {
                id: "table",
                component: "Table",

                columns: [
                  {
                    field: options.wrongField
                      ? "invented"
                      : "average_temperature",
                  },
                ],
              },
            ],
          },
        ],
      },
    };
  });
  mock.method(globalThis, "fetch", async (url, init) => {
    if (String(url).endsWith("/validate")) {
      calls.push("check");
      assert.deepEqual(JSON.parse(init.body), { sql });
      return Response.json(
        options.invalidSql
          ? {
              approved: false,
              policyVersion: "historian-v2",
              code: "SQL_POLICY_REJECTED",
              message: "Fixture deterministic rejection",
            }
          : { approved: true, policyVersion: "historian-v2" },
      );
    }
    if (String(url).endsWith("/query")) {
      calls.push("execute");
      assert.equal(
        JSON.parse(init.body).createUi,
        undefined,
        "UI choice stays out of SQL policy input",
      );
      return Response.json(
        options.executionFailure
          ? {
              status: "rejected",
              question,
              sql,
              explanation: "Fixture query",
              review,
              policyVersion: "historian-v2",
              stage: "execution",
              code: "EXECUTION_FAILED",
              message: "Fixture execution failure",
            }
          : execution,
      );
    }
    assert.fail(
      `Unexpected backend request: ${url}. The workflow must not fetch the dataset again.`,
    );
  });
  try {
    const workflow = createHistorianQueryWorkflow(
      "fixture-key",
      "fixture-model",
      "http://fixture.invalid",
    );
    const tool = createQueryHistorianTool(workflow);
    // Exercise the public tool, the complete workflow, and output parsing together.
    const result = await tool.execute(
      queryHistorianInputSchema.parse(input),
      {},
    );
    return { result: queryHistorianOutputSchema.parse(result), calls, dataset };
  } finally {
    mock.restoreAll();
  }
}

test("data-only tool calls return real query values without invoking the UI agent", async () => {
  const { result, calls, dataset } = await runCase({
    question: "What is the average temperature?",
  });
  assert.equal(result.kind, "data");
  const { kind, ...executedResult } = result;
  const dataInput = { format: "data", result: executedResult };
  const uiInput = { format: "ui", result: executedResult };
  assert.equal(returnDataInputSchema.safeParse(dataInput).success, true);
  assert.equal(returnDataInputSchema.safeParse(uiInput).success, false);
  assert.equal(generateA2uiInputSchema.safeParse(uiInput).success, true);
  assert.equal(generateA2uiInputSchema.safeParse(dataInput).success, false);
  assert.equal(selectedResultSchema.safeParse(dataInput).success, true);
  assert.equal(selectedResultSchema.safeParse(uiInput).success, true);
  assert.deepEqual(result.data, dataset);
  assert.equal(result.a2ui_operations, undefined);
  assert.equal(tryParseA2UIOperations(JSON.stringify(result)), null);
  assert.deepEqual(calls, [
    "sql-generator",
    "check",
    "sql-reviewer",
    "execute",
    "result-format",
  ]);
  assert.equal(
    queryHistorianOutputSchema.safeParse({ ...result, data: undefined })
      .success,
    false,
  );
});

test("the workflow chooses UI and returns validated A2UI operations", async () => {
  const { result, calls } = await runCase(
    {
      question: "Show the average temperature in a table",
    },
    { format: "ui" },
  );
  assert.equal(result.kind, "ui");
  assert.equal(result.data, undefined);
  assert.equal(result.a2ui_operations.length, 3);
  assert.deepEqual(
    tryParseA2UIOperations(JSON.stringify(result)).operations,
    result.a2ui_operations,
  );
  assert.equal(
    result.a2ui_operations[0].createSurface.surfaceId,
    result.a2ui_operations[1].updateComponents.surfaceId,
  );
  assert.deepEqual(calls, [
    "sql-generator",
    "check",
    "sql-reviewer",
    "execute",
    "result-format",
    "result-composer",
  ]);
  assert.equal(
    queryHistorianOutputSchema.safeParse({
      ...result,
      a2ui_operations: undefined,
    }).success,
    false,
  );
});

test("a rejected query skips execution and UI generation", async () => {
  const { result, calls } = await runCase(
    { question: "Rejected request" },
    { reject: true },
  );
  assert.equal(result.kind, "error");
  assert.equal(result.status, "rejected");
  assert.deepEqual(calls, ["sql-generator", "check", "sql-reviewer"]);
});

test("failed or invalid UI generation returns an explicit error without UI operations", async () => {
  for (const options of [{ compositionFailure: true }, { wrongField: true }]) {
    const { result } = await runCase(
      { question: "Show temperatures" },
      { ...options, format: "ui" },
    );
    assert.equal(result.kind, "error");
    assert.equal(result.status, "executed");
    assert.ok(result.message);
    assert.equal(result.a2ui_operations, undefined);
  }
});

test("the deterministic check rejects SQL before the review agent or execution runs", async () => {
  const { result, calls } = await runCase(
    { question: "Invalid SQL" },
    { invalidSql: true },
  );
  assert.equal(result.kind, "error");
  assert.equal(result.stage, "validator");
  assert.deepEqual(calls, ["sql-generator", "check"]);
});

test("execution failure skips both result branches", async () => {
  const { result, calls } = await runCase(
    { question: "Show temperatures" },
    { executionFailure: true },
  );
  assert.equal(result.kind, "error");
  assert.equal(result.stage, "execution");
  assert.deepEqual(calls, [
    "sql-generator",
    "check",
    "sql-reviewer",
    "execute",
  ]);
});

test("the public tool accepts only the question, not a UI decision", () => {
  const input = { question: "Show the temperatures in a table" };
  assert.deepEqual(queryHistorianInputSchema.parse(input), input);
  assert.equal(
    queryHistorianInputSchema.safeParse({ ...input, createUi: true }).success,
    false,
  );
  assert.equal(
    queryHistorianInputSchema.safeParse({ ...input, format: "ui" }).success,
    false,
  );
});

test("a failed or invalid format decision stops before generating a UI", async () => {
  for (const options of [{ formatFailure: true }, { format: "invalid" }]) {
    const { result, calls } = await runCase(
      { question: "Show temperatures" },
      options,
    );
    assert.equal(result.kind, "error");
    assert.ok(result.message);
    assert.equal(result.a2ui_operations, undefined);
    assert.deepEqual(calls, [
      "sql-generator",
      "check",
      "sql-reviewer",
      "execute",
      "result-format",
    ]);
  }
});

test("the replacement catalogue supports a standalone table, cards with multiple tables, and text-only cards", async () => {
  const dataset = {
    sql: "SELECT * FROM historian_readings",
    createdAt: "2026-09-15T00:00:00.000Z",
    question: "Fixture composition",
    rowCount: 2,
    columns: [
      { key: "shift_manager_name", type: "text", label: "Manager" },
      { key: "room_name", type: "text", label: "Room" },
      { key: "numeric_value", type: "number", label: "Temperature" },
    ],
    rows: [
      { shift_manager_name: "A", room_name: "Cooling", numeric_value: 17 },
      { shift_manager_name: "B", room_name: "Packaging", numeric_value: 22 },
    ],
  };
  const table = (id) => ({
    id,
    component: "Table",

    columns: [{ field: "numeric_value" }],
  });
  const cases = [
    [{ components: [table("root")] }],
    ["A", "B"].map((manager) => ({
      components: [
        {
          id: "root",
          component: "Card",
          title: manager,
          children: ["explanation", "cooling", "packaging"],
        },
        {
          id: "explanation",
          component: "Text",
          text: "Readings for this manager.",
        },
        table("cooling"),
        table("packaging"),
      ],
    })),
    ["Cooling", "Packaging"].map((room) => ({
      components: [
        {
          id: "root",
          component: "Card",
          title: room,
          children: ["description"],
        },
        {
          id: "description",
          component: "Text",
          text: "A room in the query result.",
        },
      ],
    })),
  ];
  for (const surfaces of cases) {
    const operations = await composeResult(
      {
        generate: async (prompt) => {
          assert.deepEqual(JSON.parse(prompt), {
            question: dataset.question,
            dataset: {
              columns: dataset.columns,
            },
          });
          return { object: { surfaces } };
        },
      },
      dataset,
    );
    assert.equal(operations.length, surfaces.length * 3);
    assert.deepEqual(
      tryParseA2UIOperations(JSON.stringify({ a2ui_operations: operations }))
        .operations,
      operations,
    );
    assert.deepEqual(
      operations
        .filter((operation) => operation.updateComponents)
        .map((operation) => operation.updateComponents.components),
      surfaces.map((surface) => bindTables(surface.components)),
    );
  }
});

test("the application assigns the A2UI root ID without changing model-selected content", async () => {
  const dataset = {
    sql: "SELECT * FROM historian_readings",
    createdAt: "2026-09-15T00:00:00.000Z",
    question: "Table only",
    columns: [{ key: "value", label: "Value", type: "number" }],
    rows: [{ value: 18 }],
    rowCount: 1,
  };
  const components = [
    {
      id: "temperature-table",
      component: "Table",

      columns: [{ field: "value" }],
    },
  ];
  const operations = await composeResult(
    { generate: async () => ({ object: { surfaces: [{ components }] } }) },
    dataset,
  );
  assert.deepEqual(operations[1].updateComponents.components, [
    { ...components[0], id: "root", dataset: { path: "dataset" } },
  ]);
  assert.equal(components[0].id, "temperature-table");
});

function bindTables(components) {
  return components.map((component) =>
    component.component === "Table"
      ? { ...component, dataset: { path: "dataset" } }
      : component,
  );
}
