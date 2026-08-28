import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createWorkshopCopilotRuntime } from "./copilot-runtime.js";
import type { LiveTelemetry } from "./live-telemetry.js";
import type { FacilityRepository } from "./repository.js";
import { createFacilityServer } from "./server.js";

describe("facility server boundary", () => {
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

  it("advertises the remote Mastra agent through the unchanged CopilotKit route", async () => {
    const server = createFacilityServer(
      {} as FacilityRepository,
      {} as LiveTelemetry,
      createWorkshopCopilotRuntime(),
    );
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;

    const healthResponse = await fetch(`http://127.0.0.1:${port}/api/health`);
    const infoResponse = await fetch(
      `http://127.0.0.1:${port}/api/copilotkit/info`,
    );
    const info = await infoResponse.json();
    const oldChatResponse = await fetch(`http://127.0.0.1:${port}/api/chat`, {
      method: "POST",
    });

    expect(healthResponse.status).toBe(200);
    expect(await healthResponse.json()).toEqual({
      status: "ok",
      database: "sqlite",
    });
    expect(infoResponse.status).toBe(200);
    expect(JSON.stringify(info)).toContain("default");
    expect(JSON.stringify(info)).not.toContain("facility");
    expect(oldChatResponse.status).toBe(404);
  });

  it("exposes the reviewed request only to the deterministic historian executor", async () => {
    const execute = vi.fn(async (request) => ({
      status: "executed" as const,
      ...request,
      policyVersion: "historian-v1",
      columns: ["maximum"],
      rows: [[19.8]],
      rowCount: 1,
      truncated: false,
      durationMs: 3,
    }));
    const server = createFacilityServer(
      {} as FacilityRepository,
      {} as LiveTelemetry,
      createWorkshopCopilotRuntime(),
      { execute },
    );
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const request = {
      question: "What was the maximum?",
      sql: "SELECT MAX(numeric_value) AS maximum FROM historian_readings",
      explanation: "Calculate the maximum.",
      review: { approved: true, summary: "Matches.", concerns: [] },
    };

    const response = await fetch(
      `http://127.0.0.1:${port}/api/historian/query`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      },
    );

    expect(response.status).toBe(200);
    expect(execute).toHaveBeenCalledWith(request);
    expect(await response.json()).toMatchObject({
      status: "executed",
      rows: [[19.8]],
    });
  });
});
