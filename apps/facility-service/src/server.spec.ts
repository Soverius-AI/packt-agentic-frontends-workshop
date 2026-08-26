import { once } from "node:events";
import type { AddressInfo } from "node:net";
import type { BaseEvent, RunAgentInput } from "@ag-ui/core";
import { Agent } from "@mastra/core/agent";
import { createMockModel } from "@mastra/core/test-utils/llm-mock";
import { afterEach, describe, expect, it } from "vitest";
import {
  CHAT_SYSTEM_PROMPT,
  createWorkshopAgUiAgent,
  createWorkshopCopilotRuntime,
  createWorkshopMastraAgent,
} from "./copilot-runtime.js";
import type { LiveTelemetry } from "./live-telemetry.js";
import type { FacilityRepository } from "./repository.js";
import { createFacilityServer } from "./server.js";

const runInput: RunAgentInput = {
  threadId: "test-thread",
  runId: "test-run",
  state: {},
  messages: [{ id: "user-1", role: "user", content: "Hello" }],
  tools: [],
  context: [],
  forwardedProps: {},
};

const collectEvents = (agent: ReturnType<typeof createWorkshopAgUiAgent>) =>
  new Promise<BaseEvent[]>((resolve, reject) => {
    const events: BaseEvent[] = [];
    agent.run(runInput).subscribe({
      next: (event) => events.push(event),
      error: reject,
      complete: () => resolve(events),
    });
  });

describe("CopilotKit runtime", () => {
  const servers: ReturnType<typeof createFacilityServer>[] = [];

  afterEach(async () => {
    await Promise.all(
      servers
        .splice(0)
        .map(
          (server) =>
            new Promise<void>((resolve, reject) =>
              server.close((error) => (error ? reject(error) : resolve())),
            ),
        ),
    );
  });

  it("wraps a tool-free Mastra agent with the preserved capability boundary", async () => {
    const agent = createWorkshopMastraAgent({ apiKey: "test-key" });

    expect(agent.id).toBe("default");
    expect(await agent.getInstructions()).toBe(CHAT_SYSTEM_PROMPT);
    expect(await agent.getToolsForExecution({})).toEqual({});
  });

  it("streams Mastra responses as AG-UI lifecycle and text events", async () => {
    const agent = new Agent({
      id: "default",
      name: "Test agent",
      instructions: CHAT_SYSTEM_PROMPT,
      model: createMockModel({ mockText: "Hello from Mastra" }),
    });

    const events = await collectEvents(createWorkshopAgUiAgent(agent));
    const eventTypes = events.map((event) => event.type);

    expect(eventTypes).toContain("RUN_STARTED");
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "TEXT_MESSAGE_CHUNK",
        delta: "Hello from Mastra",
      }),
    );
    expect(eventTypes).toContain("RUN_FINISHED");
  });

  it("terminates the AG-UI stream when the provider fails", async () => {
    const agent = new Agent({
      id: "default",
      name: "Failing test agent",
      instructions: CHAT_SYSTEM_PROMPT,
      model: createMockModel({
        mockText: "unused",
        spyStream: () => {
          throw new Error("Provider unavailable");
        },
      }),
    });

    await expect(collectEvents(createWorkshopAgUiAgent(agent))).rejects.toThrow(
      "Provider unavailable",
    );
  });

  it("advertises the Mastra-backed default agent and keeps the custom chat route removed", async () => {
    const server = createFacilityServer(
      {} as FacilityRepository,
      {} as LiveTelemetry,
      createWorkshopCopilotRuntime({ apiKey: "test-key" }),
    );
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;

    const infoResponse = await fetch(
      `http://127.0.0.1:${port}/api/copilotkit/info`,
    );
    const info = await infoResponse.json();
    const oldChatResponse = await fetch(`http://127.0.0.1:${port}/api/chat`, {
      method: "POST",
    });

    expect(infoResponse.status).toBe(200);
    expect(JSON.stringify(info)).toContain("default");
    expect(JSON.stringify(info)).not.toContain("facility");
    expect(oldChatResponse.status).toBe(404);
  });
});
