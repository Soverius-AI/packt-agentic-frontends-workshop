import { describe, expect, it } from "vitest";
import { CHAT_SYSTEM_PROMPT, createWorkshopAgent } from "./workshop-agent.js";

describe("workshop Mastra agent", () => {
  it("preserves the historian-blind backend capability boundary", async () => {
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
  });
});
