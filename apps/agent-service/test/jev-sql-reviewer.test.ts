import assert from "node:assert/strict";
import { test } from "node:test";
import { historianToolResultSchema } from "@packt-workshop/contracts";
import { createJevSqlReviewFunction } from "../src/mastra/workflows/historian-query/agents/jev-sql-reviewer";
import { createHistorianQueryWorkflow } from "../src/mastra/workflows/historian-query/workflow";

const proposal = {
  question: "Show the readings",
  sql: "SELECT reading_id, recorded_at, room_id, room_name, metric_id, metric_name, unit, numeric_value, text_value, shift_manager_name, condition FROM historian_readings",
  explanation: "Return complete readings",
};
const verdict = (noul: number) => ({
  answers: {
    safety: { type: "noul", noul },
    intent: { type: "noul", noul },
    columns: { type: "noul", noul },
  },
});

test("sends three Noul questions through OpenRouter without optional criteria", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async (url: string, options: RequestInit) => {
      assert.equal(url, "https://openrouter.ai/api/alpha/decisions");
      assert.equal(
        new Headers(options.headers).get("authorization"),
        "Bearer test-key",
      );
      assert.ok(options.signal instanceof AbortSignal);
      const body = JSON.parse(String(options.body));
      assert.equal(body.model, "typesafe/jev-1.13");
      assert.deepEqual(body.state, {
        question: proposal.question,
        sql: proposal.sql,
      });
      assert.deepEqual(Object.keys(body.questions), [
        "safety",
        "intent",
        "columns",
      ]);
      for (const key of ["safety", "intent", "columns"]) {
        assert.equal(body.questions[key].type, "noul");
        assert.equal(body.questions[key].criteria, undefined);
      }
      return Response.json(verdict(0.99));
    },
  );
  assert.equal(
    (await createJevSqlReviewFunction("test-key")(proposal)).approved,
    true,
  );
});

for (const [noul, approved] of [
  [0, false],
  [0.5, false],
  [0.51, true],
  [1, true],
] as const) {
  test(`Noul ${noul} maps to approved=${approved}`, async (t) => {
    t.mock.method(globalThis, "fetch", async () =>
      Response.json(verdict(noul)),
    );
    const result = await createJevSqlReviewFunction("test-key")(proposal);
    assert.equal(result.approved, approved);
  });
}

for (const body of [
  { answers: {} },
  verdict(-0.1),
  verdict(1.1),
  { answers: { ...verdict(1).answers, intent: { type: "noul", noul: true } } },
  {
    answers: {
      ...verdict(1).answers,
      intent: { type: "choice", choice: "pass" },
    },
  },
  { answers: { safety: { type: "noul", noul: 1 } } },
]) {
  test(`rejects malformed Noul response: ${JSON.stringify(body)}`, async (t) => {
    t.mock.method(globalThis, "fetch", async () => Response.json(body));
    await assert.rejects(
      createJevSqlReviewFunction("test-key")(proposal),
      /Invalid Jev/,
    );
  });
}

const outcomes: [string, typeof fetch, boolean][] = [
  ["approval", async () => Response.json(verdict(0.99)), true],
  ["rejection", async () => Response.json(verdict(0.01)), false],
  ["tie", async () => Response.json(verdict(0.5)), false],
  [
    "HTTP failure",
    async () => new Response("private provider details", { status: 401 }),
    false,
  ],
  [
    "timeout",
    async () => {
      throw new DOMException("Request timed out", "TimeoutError");
    },
    false,
  ],
  ["invalid JSON", async () => new Response("not json"), false],
];
for (const [name, request, approved] of outcomes) {
  test(`workflow handles Jev ${name} before database execution`, async (t) => {
    t.mock.method(globalThis, "fetch", request);
    let executions = 0;
    const workflow = createHistorianQueryWorkflow(
      "test-key",
      "",
      "http://facility.invalid",
      {
        generateSql: async () => proposal,
        request: async (_url, options) => {
          executions++;
          const reviewed = JSON.parse(String(options?.body));
          assert.equal(reviewed.sql, proposal.sql);
          return Response.json({
            ...reviewed,
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
    const result = await (
      await workflow.createRun()
    ).start({ inputData: { question: proposal.question } });
    assert.equal(result.status, "success");
    const output = historianToolResultSchema.parse(result.result);
    assert.equal(output.status, approved ? "executed" : "rejected");
    assert.equal(executions, approved ? 1 : 0);
    if (output.status === "rejected") assert.equal(output.stage, "reviewer");
    assert.doesNotMatch(JSON.stringify(output), /private provider details/);
  });
}

for (const check of ["safety", "intent", "columns"] as const) {
  test(`${check} can independently prevent execution`, async (t) => {
    const body = verdict(0.99);
    body.answers[check].noul = 0.1;
    t.mock.method(globalThis, "fetch", async () => Response.json(body));
    const workflow = createHistorianQueryWorkflow(
      "test-key",
      "",
      "http://facility.invalid",
      {
        generateSql: async () => proposal,
        request: async () => {
          assert.fail("Rejected SQL must not execute");
        },
      },
    );
    const result = await (
      await workflow.createRun()
    ).start({ inputData: { question: proposal.question } });
    const output = historianToolResultSchema.parse(result.result);
    assert.equal(output.status, "rejected");
    assert.deepEqual(output.review.concerns, [
      `Jev did not approve the ${check} check.`,
    ]);
  });
}
