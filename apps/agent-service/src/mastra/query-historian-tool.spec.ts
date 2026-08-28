import { RequestContext } from "@mastra/core/request-context";
import { describe, expect, it, vi } from "vitest";
import {
  createQueryHistorianTool,
  latestUserQuestion,
} from "./query-historian-tool.js";

const observe = {
  span: async <Value>(_name: string, run: () => Promise<Value> | Value) =>
    run(),
  log: vi.fn(),
};

describe("query_historian Mastra tool", () => {
  it("derives the latest operator question from Mastra messages", () => {
    expect(
      latestUserQuestion([
        { role: "user", content: "Earlier question" },
        { role: "assistant", content: "Earlier answer" },
        {
          role: "user",
          content: [{ type: "text", text: "Show warning periods." }],
        },
      ]),
    ).toBe("Show warning periods.");
  });

  it("stops before the facility boundary when the reviewer rejects SQL", async () => {
    const request = vi.fn<typeof fetch>();
    const tool = createQueryHistorianTool({
      reviewSql: vi.fn(async () => ({
        approved: false,
        summary: "The query does not answer the question.",
        concerns: ["It calculates an average instead of a maximum."],
      })),
      fetch: request,
    });

    const result = await tool.execute!(
      {
        sql: "SELECT AVG(numeric_value) FROM historian_readings",
        explanation: "Calculate the average.",
      },
      {
        requestContext: new RequestContext(),
        observe,
        agent: {
          agentId: "default",
          toolCallId: "call-1",
          messages: [{ role: "user", content: "What was the maximum?" }],
          suspend: async () => undefined,
        },
      },
    );

    expect(result).toMatchObject({
      status: "rejected",
      stage: "reviewer",
      code: "REVIEW_REJECTED",
      question: "What was the maximum?",
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("passes approved SQL to the deterministic facility boundary", async () => {
    const review = {
      approved: true,
      summary: "The query answers the question.",
      concerns: [],
    };
    const request = vi.fn<typeof fetch>(async (_url, init) => {
      const payload = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({
          status: "executed",
          ...payload,
          policyVersion: "historian-v1",
          columns: ["maximum"],
          rows: [[19.8]],
          rowCount: 1,
          truncated: false,
          durationMs: 4,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    const reviewSql = vi.fn(async () => review);
    const tool = createQueryHistorianTool({
      reviewSql,
      fetch: request,
      facilityBaseUrl: "http://facility.test",
    });
    const input = {
      sql: "SELECT MAX(numeric_value) AS maximum FROM historian_readings",
      explanation: "Calculate the maximum.",
    };

    const result = await tool.execute!(input, {
      requestContext: new RequestContext(),
      observe,
      agent: {
        agentId: "default",
        toolCallId: "call-2",
        messages: [{ role: "user", content: "What was the maximum?" }],
        suspend: async () => undefined,
      },
    });

    expect(reviewSql).toHaveBeenCalledWith({
      ...input,
      question: "What was the maximum?",
    });
    expect(request).toHaveBeenCalledWith(
      "http://facility.test/api/historian/query",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toMatchObject({ status: "executed", rows: [[19.8]] });
  });
});
