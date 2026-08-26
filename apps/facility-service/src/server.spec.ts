import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createWorkshopCopilotRuntime } from "./copilot-runtime.js";
import type { LiveTelemetry } from "./live-telemetry.js";
import type { FacilityRepository } from "./repository.js";
import { createFacilityServer } from "./server.js";

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

  it("advertises the tool-free default agent and removes the custom chat route", async () => {
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
