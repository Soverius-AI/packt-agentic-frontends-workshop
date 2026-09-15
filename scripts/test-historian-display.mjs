// Run after building contracts: node --import ./node_modules/.pnpm/node_modules/tsx/dist/loader.mjs --test scripts/test-historian-display.mjs
import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { loadSolutionAgent } from "../workshop/load-solution-agent.mjs";
const { createMainAgent } = await loadSolutionAgent("07");
import { createQueryHistorianTool } from "../apps/agent-service/src/mastra/agents/main/tools/query-historian-tool.ts";
import {
  HistorianBridge,
  withoutHistorianPayloads,
} from "../apps/facility-service/src/copilot-runtime.ts";

const sentinel = "ROW_VALUE_MUST_NOT_REACH_MODEL";
const result = {
  status: "executed",
  question: "Show the latest reading.",
  sql: "SELECT * FROM historian_readings",
  explanation: "Latest stored reading.",
  review: { approved: true, summary: "Approved", concerns: [] },
  policyVersion: "historian-v1",
  rowCount: 1,
  truncated: false,
  durationMs: 1,
  entries: [
    {
      id: 1,
      recordedAt: "2026-09-15T00:00:00.000Z",
      roomId: "cooling-room",
      roomName: sentinel,
      metricId: "cooling-air-temperature",
      metricName: "Air temperature",
      unit: "°C",
      numericValue: 18,
      textValue: null,
      shiftManagerName: "Charles Bond",
      condition: "normal",
    },
  ],
};

test("browser history keeps the original result while every bridge clone forwards only a receipt", () => {
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
      id: "rows",
      role: "tool",
      toolCallId: "query",
      content: JSON.stringify(result),
    },
    { id: "alarm", role: "tool", toolCallId: "approval", content: "rejected" },
  ];
  assert.equal(
    JSON.stringify(withoutHistorianPayloads(history)).includes(sentinel),
    false,
  );
  assert.ok(history[1].content.includes(sentinel));
  const run = mock.method(
    Object.getPrototypeOf(HistorianBridge.prototype),
    "run",
    (input) => input,
  );
  try {
    const bridge = new HistorianBridge({ agent: {}, resourceId: "fixture" });
    const forwarded = bridge.clone().run({ messages: history });
    assert.equal(JSON.stringify(forwarded).includes(sentinel), false);
    assert.ok(forwarded.messages.includes(history[2]));
  } finally {
    run.mock.restore();
  }
});

test("completion receipts report empty, truncated and failed results without row values", () => {
  const tool = createQueryHistorianTool({});
  assert.match(tool.toModelOutput(result).value, /displayed/);
  assert.equal(
    JSON.stringify(tool.toModelOutput(result)).includes(sentinel),
    false,
  );
  assert.match(
    tool.toModelOutput({ ...result, entries: [], rowCount: 0 }).value,
    /No matching readings/,
  );
  assert.match(
    tool.toModelOutput({ ...result, truncated: true }).value,
    /first 200/,
  );
  assert.match(
    tool.toModelOutput({ status: "rejected", message: "Query rejected." })
      .value,
    /failure and stop/,
  );
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

test("the real agent completes without a second display tool and starts a new run for the same later request", async () => {
  let runs = 0;
  const agent = createMainAgent("fixture-key", "google/gemma-4-31b-it", {
    createRun: async () => {
      runs++;
      return { start: async () => ({ status: "success", result }) };
    },
  });
  const requests = [];
  mock.method(globalThis, "fetch", async (_url, init) => {
    requests.push(JSON.parse(init.body));
    return response(
      requests.length % 2
        ? [
            {
              type: "function_call",
              id: "fc_fixture",
              call_id: "call_fixture",
              name: "query_historian",
              arguments: JSON.stringify({ question: result.question }),
              status: "completed",
            },
          ]
        : [
            {
              id: "msg_fixture",
              type: "message",
              role: "assistant",
              status: "completed",
              content: [
                {
                  type: "output_text",
                  text: "The result is displayed.",
                  annotations: [],
                },
              ],
            },
          ],
    );
  });
  try {
    const first = await agent.generate(result.question, { maxSteps: 2 });
    assert.equal(first.text, "The result is displayed.");
    assert.equal(runs, 1);
    await agent.generate(
      [
        { role: "user", content: result.question },
        {
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolCallId: "old-call",
              toolName: "query_historian",
              args: { question: result.question },
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
        { role: "assistant", content: "The result is displayed." },
        { role: "user", content: result.question },
      ],
      { maxSteps: 2 },
    );
    assert.equal(runs, 2);
    assert.equal(JSON.stringify(requests).includes(sentinel), false);
    assert.equal(
      JSON.stringify(requests).includes("show_historian_readings"),
      false,
    );
  } finally {
    mock.restoreAll();
  }
});
