import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import type { LiveTelemetry } from "./live-telemetry.js";
import type { FacilityRepository } from "./repository.js";
import { createFacilityServer } from "./server.js";

describe("POST /api/chat", () => {
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

  it("validates and returns one assistant message over plain HTTP", async () => {
    const server = createFacilityServer(
      {} as FacilityRepository,
      {} as LiveTelemetry,
      {
        reply: async (messages) => ({
          message: {
            role: "assistant",
            content: `Received ${messages.length} message.`,
          },
        }),
      },
    );
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;

    const response = await fetch(`http://127.0.0.1:${port}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What does a warning mean?" }],
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: { role: "assistant", content: "Received 1 message." },
    });
  });
});
