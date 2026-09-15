// node --import ./node_modules/.pnpm/node_modules/tsx/dist/loader.mjs --test scripts/test-a2ui-model-boundary.mjs
import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { createRequire } from "node:module";
import { composeResult } from "../apps/agent-service/src/mastra/workflows/historian-composition/agents/result-composer-agent.ts";
import { loadSolutionAgent } from "../workshop/load-solution-agent.mjs";
const { createMainAgent } = await loadSolutionAgent("08");
import { createQueryHistorianTool } from "../apps/agent-service/src/mastra/agents/main/tools/query-composition-tool.ts";
import {
  facilityCatalogDefinitions,
  FACILITY_CATALOG_ID,
} from "../packages/contracts/dist/index.js";
import {
  HistorianBridge,
  withoutHistorianPayloads,
} from "../apps/facility-service/src/copilot-runtime.ts";

const uiRequire = createRequire(
  new URL("../apps/angular-host/package.json", import.meta.url),
);
const rendererRequire = createRequire(
  uiRequire.resolve("@copilotkit/a2ui-renderer"),
);
const { Catalog, MessageProcessor, ComponentContext, GenericBinder } =
  await import(rendererRequire.resolve("@a2ui/web_core/v0_9"));
const sentinel = "ROW_VALUE_MUST_NOT_REACH_MODEL";

test("forwarded browser history removes result payloads without changing the displayed history or alarm tools", () => {
  const history = [
    {
      id: "call",
      role: "assistant",
      toolCalls: [
        {
          id: "query",
          type: "function",
          function: { name: "query_historian", arguments: "{}" },
        },
      ],
    },
    {
      id: "result",
      role: "tool",
      toolCallId: "query",
      content: sentinel.repeat(100_000),
    },
    {
      id: "view",
      role: "activity",
      activityType: "a2ui-surface",
      content: { rows: [sentinel] },
    },
    { id: "alarm", role: "tool", toolCallId: "approval", content: "rejected" },
    { id: "question", role: "user", content: "Show the rooms instead." },
  ];
  const forwarded = withoutHistorianPayloads(history);
  assert.equal(JSON.stringify(forwarded).includes(sentinel), false);
  assert.ok(history[1].content.includes(sentinel));
  assert.ok(forwarded.includes(history[3]));
  assert.ok(forwarded.includes(history[4]));
  assert.equal(
    forwarded.some((message) => message.role === "activity"),
    false,
  );
  // CopilotRuntime clones its agent before each run. Exercise that real boundary.
  const run = mock.method(
    Object.getPrototypeOf(HistorianBridge.prototype),
    "run",
    (input) => input,
  );
  try {
    const bridge = new HistorianBridge({ agent: {}, resourceId: "fixture" });
    const input = bridge.clone().run({ messages: history });
    assert.equal(JSON.stringify(input).includes(sentinel), false);
    assert.ok(history[1].content.includes(sentinel));
  } finally {
    run.mock.restore();
  }
});
const dataset = {
  question: "Show a card per manager with a table for each room.",
  sql: "SELECT * FROM historian_readings",
  createdAt: "2026-09-15T00:00:00.000Z",
  columns: [
    { key: "manager", label: "Manager", type: "text" },
    { key: "room_name", label: "Room", type: "text" },
    { key: "room_description", label: "Description", type: "text" },
    { key: "value", label: "Temperature", type: "number" },
  ],
  rowCount: 80,
  rows: Array.from({ length: 80 }, (_, index) => ({
    manager: index < 40 ? sentinel : "Another manager",
    room_name: index % 2 ? "Warm" : "Cold",
    room_description:
      index % 2 ? "Packaging happens here." : "Chocolate rests here.",
    value: index,
  })),
};
const components = [
  {
    id: "root",
    component: "Card",
    children: { componentId: "manager", path: "groups" },
  },
  {
    id: "manager",
    component: "Card",
    title: { path: "label" },
    children: ["note", "rooms"],
  },
  { id: "note", component: "Text", text: "Temperature readings by room." },
  {
    id: "rooms",
    component: "Card",
    children: { componentId: "table", path: "groups" },
  },
  {
    id: "table",
    component: "Table",
    title: { path: "label" },
    columns: [{ field: "value" }],
  },
];
async function operations(
  data = dataset,
  layout = components,
  groupBy = ["manager", "room_name"],
) {
  return composeResult(
    {
      generate: async (prompt) => {
        assert.deepEqual(JSON.parse(prompt), {
          question: data.question,
          dataset: { columns: data.columns },
        });
        assert.equal(prompt.includes(sentinel), false);
        return { object: { surfaces: [{ components: layout, groupBy }] } };
      },
    },
    data,
  );
}
function bind(ops) {
  const catalog = new Catalog(
    FACILITY_CATALOG_ID,
    Object.entries(facilityCatalogDefinitions).map(([name, def]) => ({
      name,
      schema: def.props,
    })),
  );
  const processor = new MessageProcessor([catalog]);
  let surface;
  processor.onSurfaceCreated((created) => {
    surface = created;
  });
  processor.processMessages(ops);
  return (id, type, basePath = "/") => {
    const binder = new GenericBinder(
      new ComponentContext(surface, id, basePath),
      facilityCatalogDefinitions[type].props,
    );
    const props = binder.snapshot;
    binder.dispose();
    return props;
  };
}
function uiResult(ops) {
  const { rows, question, sql, ...metadata } = dataset;
  return {
    kind: "ui",
    status: "executed",
    question,
    sql,
    explanation: "Fixture query",
    review: { approved: true, summary: "Approved", concerns: [] },
    policyVersion: "historian-v2",
    dataset: metadata,
    entries: [],
    rowCount: rows.length,
    truncated: false,
    durationMs: 1,
    a2ui_operations: ops,
  };
}

test("native A2UI bindings repeat manager and room templates without exposing values to the composer", async () => {
  const resolve = bind(await operations());
  const managers = resolve("root", "Card").children;
  assert.equal(managers.length, 2);
  for (const manager of managers) {
    const card = resolve(manager.id, "Card", manager.basePath);
    const roomTables = resolve("rooms", "Card", manager.basePath).children;
    assert.equal(roomTables.length, 2);
    for (const ref of roomTables) {
      const table = resolve(ref.id, "Table", ref.basePath);
      assert.equal(table.dataset.rows.length, 20);
      assert.ok(
        table.dataset.rows.every(
          (row) => row.manager === card.title && row.room_name === table.title,
        ),
      );
    }
  }
});

test("room descriptions bind to original text without being read or rewritten by a model", async () => {
  const layout = [
    {
      id: "root",
      component: "Card",
      children: { componentId: "room", path: "groups" },
    },
    {
      id: "room",
      component: "Card",
      title: { path: "label" },
      children: ["description"],
    },
    {
      id: "description",
      component: "Text",
      text: { path: "dataset/rows/0/room_description" },
    },
  ];
  const resolve = bind(await operations(dataset, layout, ["room_name"]));
  const rooms = resolve("root", "Card").children;
  assert.equal(rooms.length, 2);
  for (const room of rooms) {
    const title = resolve(room.id, "Card", room.basePath).title;
    const text = resolve("description", "Text", room.basePath).text;
    assert.equal(
      text,
      dataset.rows.find((row) => row.room_name === title).room_description,
    );
  }
  await assert.rejects(
    operations(
      dataset,
      [
        {
          id: "root",
          component: "Text",
          text: { path: "dataset/rows/0/invented" },
        },
      ],
      [],
    ),
    /unavailable/,
  );
});

test("tool model output excludes query values for UI and data results, including aggregates", async () => {
  const tool = createQueryHistorianTool({});
  const ui = uiResult(await operations());
  assert.equal(
    JSON.stringify(tool.toModelOutput(ui)).includes(sentinel),
    false,
  );
  assert.equal(tool.toModelOutput(ui).type, "text");
  const data = { ...ui, kind: "data", data: dataset };
  data.data = {
    ...dataset,
    columns: [
      ...dataset.columns,
      { key: "reading_id", type: "number", label: "ID" },
    ],
  };
  assert.equal(tool.toModelOutput(data).data, undefined);
  data.data = {
    ...dataset,
    rows: [{ average_temperature: 18.5 }],
    columns: [{ key: "average_temperature", type: "number", label: "Average" }],
    rowCount: 1,
  };
  assert.equal(tool.toModelOutput(data).data, undefined);
  assert.equal(
    JSON.stringify(tool.toModelOutput(data)).includes("18.5"),
    false,
  );
  data.data = {
    ...dataset,
    rows: Array.from({ length: 1000 }, () => dataset.rows[0]),
  };
  assert.equal(tool.toModelOutput(data).data, undefined);
});

function response(output) {
  return Response.json({
    id: "resp_fixture",
    created_at: 0,
    model: "google/gemma-4-31b-it",
    output,
    usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
  });
}
function answer(text = "The view is displayed.") {
  return response([
    {
      id: "msg_fixture",
      type: "message",
      role: "assistant",
      status: "completed",
      content: [
        {
          type: "output_text",
          text,
          annotations: [],
        },
      ],
    },
  ]);
}

for (const kind of ["ui", "error"])
  test(`actual model requests exclude ${kind} rows and a new message starts a new workflow run`, async () => {
    const result = { ...uiResult(await operations()), kind };
    if (kind === "error") result.message = "Invalid composition.";
    const acknowledgement =
      kind === "ui"
        ? "The view is displayed."
        : "The view could not be generated. Send a new request to start a new run.";
    let executions = 0;
    let createdRuns = 0;
    const executedRuns = [];
    const workflow = {
      createRun: async () => {
        const runId = ++createdRuns;
        return {
          start: async () => {
            executions++;
            executedRuns.push(runId);
            return { status: "success", result };
          },
        };
      },
    };
    const agent = createMainAgent(
      "fixture-key",
      "google/gemma-4-31b-it",
      workflow,
    );
    const requests = [];
    mock.method(globalThis, "fetch", async (_url, init) => {
      requests.push(JSON.parse(init.body));
      if (requests.length === 1 || requests.length === 3)
        return response([
          {
            type: "function_call",
            id: "fc_fixture",
            call_id: "call_fixture",
            name: "query_historian",
            arguments: JSON.stringify({ question: dataset.question }),
            status: "completed",
          },
        ]);
      return answer(acknowledgement);
    });
    try {
      const generated = await agent.generate(dataset.question, { maxSteps: 2 });
      assert.equal(executions, 1);
      assert.equal(generated.text, acknowledgement);
      assert.ok(requests.length >= 2);
      assert.equal(JSON.stringify(requests).includes(sentinel), false);
      const toolOutput = requests[1].input.find(
        (item) => item.type === "function_call_output",
      );
      assert.equal(typeof toolOutput?.output, "string");
      assert.match(
        toolOutput.output,
        kind === "ui" ? /displayed/ : /Invalid composition/,
      );
      if (kind === "error")
        assert.match(toolOutput.output, /new request.*new run/);
      await agent.generate(
        [
          { role: "user", content: dataset.question },
          {
            role: "assistant",
            content: [
              {
                type: "tool-call",
                toolCallId: "old-call",
                toolName: "query_historian",
                args: { question: dataset.question },
              },
            ],
          },
          {
            role: "tool",
            content: [
              {
                type: "tool-result",
                toolCallId: "old-call",
                toolName: "query_historian",
                result,
              },
            ],
          },
          { role: "assistant", content: "The view is displayed." },
          { role: "user", content: dataset.question },
        ],
        { maxSteps: 2 },
      );
      assert.equal(JSON.stringify(requests.at(-1)).includes(sentinel), false);
      assert.equal(executions, 2);
      assert.deepEqual(executedRuns, [1, 2]);
    } finally {
      mock.restoreAll();
    }
  });
