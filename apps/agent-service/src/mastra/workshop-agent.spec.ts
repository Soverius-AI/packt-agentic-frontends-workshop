import { describe, expect, it } from "vitest";
import { CHAT_SYSTEM_PROMPT, createWorkshopAgent } from "./workshop-agent.js";
import { createQueryHistorianTool } from "./query-historian-tool.js";
import {
  createSqlReviewerAgent,
  parseSqlReviewText,
  SQL_REVIEWER_INSTRUCTIONS,
} from "./sql-reviewer.js";

describe("workshop Mastra agent", () => {
  it("documents the reviewed and deterministically validated historian boundary", async () => {
    const agent = createWorkshopAgent({ apiKey: "test-key" });

    expect(agent.id).toBe("default");
    expect(await agent.getInstructions()).toBe(CHAT_SYSTEM_PROMPT);
    expect(await agent.getToolsForExecution({})).toEqual({});
    expect(CHAT_SYSTEM_PROMPT).toContain("set_view");
    expect(CHAT_SYSTEM_PROMPT).toContain("update_filters");
    expect(CHAT_SYSTEM_PROMPT).toContain("clear_filters");
    expect(CHAT_SYSTEM_PROMPT).toContain("list_rooms");
    expect(CHAT_SYSTEM_PROMPT).toContain("list_metrics");
    expect(CHAT_SYSTEM_PROMPT).toContain("list_shift_managers");
    expect(CHAT_SYSTEM_PROMPT).toContain("list_conditions");
    expect(CHAT_SYSTEM_PROMPT).toContain("preserving omitted values");
    expect(CHAT_SYSTEM_PROMPT).toContain("query_historian");
    expect(CHAT_SYSTEM_PROMPT).toContain("separate SQL reviewer");
    expect(CHAT_SYSTEM_PROMPT).toContain("deterministic policy");
  });

  it("registers exactly one backend data tool when the checkpoint is assembled", async () => {
    const queryHistorianTool = createQueryHistorianTool({
      reviewSql: async () => ({
        approved: false,
        summary: "Test reviewer.",
        concerns: [],
      }),
    });
    const agent = createWorkshopAgent({
      apiKey: "test-key",
      queryHistorianTool,
    });

    expect(await agent.getToolsForExecution({})).toMatchObject({
      query_historian: expect.objectContaining({ id: "query_historian" }),
    });
  });

  it("keeps the SQL reviewer tool-free and semantically focused", async () => {
    const reviewer = createSqlReviewerAgent({ apiKey: "test-key" });

    expect(reviewer.id).toBe("sql-reviewer");
    expect(await reviewer.getInstructions()).toBe(SQL_REVIEWER_INSTRUCTIONS);
    expect(await reviewer.getToolsForExecution({})).toEqual({});
    expect(SQL_REVIEWER_INSTRUCTIONS).toContain("semantic correctness");
    expect(SQL_REVIEWER_INSTRUCTIONS).toContain("deterministic policy");
    expect(
      parseSqlReviewText(
        '```json\n{"approved":true,"summary":"Matches.","concerns":[]}\n```',
      ),
    ).toEqual({ approved: true, summary: "Matches.", concerns: [] });
  });
});
