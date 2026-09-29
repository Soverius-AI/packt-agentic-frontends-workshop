import assert from "node:assert/strict";
import { test } from "node:test";
import { ToolStream } from "@mastra/core/tools";
import { historianProgressEventSchema } from "@packt-workshop/contracts";
import { RequestContext } from "@mastra/core/request-context";
import {
  HistorianPolicyError,
  validateHistorianStatement,
  historianToolResultSchema,
} from "@packt-workshop/contracts";
import { createHistorianQueryWorkflow } from "../src/mastra/workflows/historian-query/workflow";
import { createQueryHistorianTool } from "../src/mastra/agents/main/tools/query-historian-tool";

const safeSql =
  "SELECT reading_id, recorded_at, room_id, room_name, metric_id, metric_name, unit, numeric_value, text_value, shift_manager_name, condition FROM historian_readings";
const question = "Show the readings";

function setup(sql: string, approved = true) {
  const calls: string[] = [];
  const workflow = createHistorianQueryWorkflow(
    "",
    "",
    "http://facility.invalid",
    {
      generateSql: async () => {
        calls.push("generate");
        return { sql, explanation: "Select readings" };
      },
      reviewSql: async (proposal) => {
        calls.push("review");
        assert.equal(proposal.sql, sql);
        return {
          approved,
          concerns: [],
        };
      },
      request: async (_url, options) => {
        calls.push("execute");
        const proposal = JSON.parse(String(options?.body));
        assert.equal(proposal.sql, sql);
        return Response.json({
          ...proposal,
          status: "executed",
          entries: [],
          rowCount: 0,
          truncated: false,
          durationMs: 1,
          policyVersion: "historian-v1",
        });
      },
    },
  );
  return { workflow, calls };
}

for (const sql of [
  "UPDATE historian_readings SET numeric_value = 0",
  "delete FROM historian_readings",
  "/* pretend this is safe */ DrOp TABLE metrics",
  "INSERT INTO metrics VALUES (1)",
  "WITH data AS (SELECT 1) DELETE FROM metrics",
  `${safeSql}; DROP TABLE metrics`,
  `${safeSql}; SELECT * FROM historian_readings`,
  "ATTACH DATABASE '/tmp/other.sqlite' AS other",
  "PRAGMA writable_schema = ON",
  "SELECT 'unterminated",
]) {
  test(`preflight stops before review and execution: ${sql}`, async () => {
    const { workflow, calls } = setup(sql);
    const run = await workflow.createRun();
    const result = await run.start({ inputData: { question } });
    // Mastra treats an intentional bail as a completed run carrying the rejection.
    assert.equal(result.status, "success");
    const output = historianToolResultSchema.parse(result.result);
    assert.equal(output.status, "rejected");
    if (output.status !== "rejected") throw new Error("Expected rejection");
    assert.equal(output.stage, "preflight");
    assert.deepEqual(output.review, { approved: false, concerns: [] });
    assert.deepEqual(calls, ["generate"]);
  });
}

for (const sql of [
  `${safeSql};`,
  `-- DROP is only a comment\n${safeSql} /* UPDATE, DELETE, INSERT */`,
  `${safeSql} WHERE room_name = 'Don''t DROP; DELETE or INSERT'`,
  "WITH latest AS (SELECT * FROM historian_readings) SELECT * FROM latest",
  'SELECT "update", [delete], `drop` FROM historian_readings',
]) {
  test(`scanner handles read-only SQL and quoted text: ${sql}`, () => {
    assert.doesNotThrow(() => validateHistorianStatement(sql));
  });
}

test("successful preflight preserves the exact SQL through review and execution", async () => {
  const { workflow, calls } = setup(`${safeSql};`);
  const result = await (
    await workflow.createRun()
  ).start({ inputData: { question } });
  assert.equal(result.status, "success");
  assert.equal(
    historianToolResultSchema.parse(result.result).status,
    "executed",
  );
  assert.deepEqual(calls, ["generate", "review", "execute"]);
});

test("semantic rejection still prevents execution after passing preflight", async () => {
  const { workflow, calls } = setup(safeSql, false);
  const result = await (
    await workflow.createRun()
  ).start({ inputData: { question } });
  const output = historianToolResultSchema.parse(result.result);
  assert.equal(output.status, "rejected");
  if (output.status !== "rejected") throw new Error("Expected rejection");
  assert.equal(output.stage, "reviewer");
  assert.deepEqual(calls, ["generate", "review"]);
});

test("tool adapter returns a preflight rejection instead of treating bail as a crash", async () => {
  const { workflow, calls } = setup("DROP TABLE metrics");
  const tool = createQueryHistorianTool(workflow);
  assert.ok(tool.execute);
  const output = await tool.execute(
    { question },
    { requestContext: new RequestContext() },
  );
  assert.equal(output.status, "rejected");
  assert.deepEqual(calls, ["generate"]);
});

test("scanner exposes the same policy error class for both services", () => {
  assert.throws(
    () => validateHistorianStatement("INSERT INTO metrics VALUES (1)"),
    HistorianPolicyError,
  );
});

test("workflow progress reaches the tool writer in order with visible two-second checks", async () => {
  const { workflow } = setup(safeSql);
  const tool = createQueryHistorianTool(workflow);
  const events: { message: string; status: string; id: string; at: number }[] =
    [];
  const writer = new ToolStream(
    {
      prefix: "tool",
      callId: "demo",
      name: "query_historian",
      runId: "agent-run",
    },
    async (chunk) => {
      const event = historianProgressEventSchema.safeParse(chunk);
      if (event.success)
        events.push({
          ...event.data.data.content,
          id: event.data.data.id,
          at: performance.now(),
        });
    },
  );
  const result = await tool.execute!(
    { question },
    { requestContext: new RequestContext(), writer },
  );
  assert.equal(result.status, "executed");
  assert.deepEqual(
    events.map((e) => e.message),
    [
      "Generating SQL…",
      "Checking SQL deterministically…",
      "Reviewing SQL with Jev…",
      "Validating and executing the query…",
      "Investigation complete · 0 readings returned",
    ],
  );
  assert.ok(events[2]!.at - events[1]!.at >= 1_900);
  assert.ok(events[3]!.at - events[2]!.at >= 1_900);
  assert.equal(events.at(-1)!.status, "completed");
  assert.equal(new Set(events.map((e) => e.id)).size, 1);
});

test("streamed preflight rejection never reports review or execution", async () => {
  const { workflow } = setup("DROP TABLE metrics");
  const stream = (await workflow.createRun()).stream({
    inputData: { question },
  });
  const messages: string[] = [];
  for await (const chunk of stream.fullStream) {
    const event = historianProgressEventSchema.safeParse(chunk);
    if (event.success) messages.push(event.data.data.content.message);
  }
  assert.equal((await stream.result).status, "success");
  assert.deepEqual(messages, [
    "Generating SQL…",
    "Checking SQL deterministically…",
    "Query rejected by the deterministic check",
  ]);
});
