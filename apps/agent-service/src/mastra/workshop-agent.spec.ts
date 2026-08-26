import { describe, expect, it } from "vitest";
import { CHAT_SYSTEM_PROMPT, createWorkshopAgent } from "./workshop-agent.js";

describe("workshop Mastra agent", () => {
  it("preserves the historian-blind backend capability boundary", async () => {
    const agent = createWorkshopAgent({ apiKey: "test-key" });

    expect(agent.id).toBe("default");
    expect(await agent.getInstructions()).toBe(CHAT_SYSTEM_PROMPT);
    expect(await agent.getToolsForExecution({})).toEqual({});
    expect(CHAT_SYSTEM_PROMPT).toContain("configure_facility_view");
    expect(CHAT_SYSTEM_PROMPT).toContain("preserving omitted values");
  });
});
