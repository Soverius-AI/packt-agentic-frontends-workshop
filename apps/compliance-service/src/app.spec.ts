import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

const incident = {
  incidentId: "INC-HVAC-PROTOCOL",
  machineId: "ROOM-3-HVAC",
  occurredAt: "2026-08-17T08:00:00.000Z",
  severity: "medium",
  summary: "Room temperature matches the outside temperature",
  telemetry: {
    temperatureCelsius: 29,
    outsideTemperatureCelsius: 29,
    trendDurationMinutes: 30,
    doorState: "unknown",
    vibrationMillimetersPerSecond: 0,
    pressureBar: 0,
  },
};

describe("compliance protocol service", () => {
  it("links the A2A case artifact to the MCP case tool", async () => {
    const app = createApp();
    const a2a = await request(app)
      .post("/a2a")
      .set("A2A-Version", "1.0")
      .send({
        jsonrpc: "2.0",
        id: "integration-1",
        method: "SendMessage",
        params: {
          message: {
            messageId: "integration-message-1",
            role: "ROLE_USER",
            parts: [
              {
                data: {
                  incident,
                  jurisdiction: "Workshop Jurisdiction",
                  correlationId: "integration-correlation-1",
                },
                mediaType: "application/json",
              },
            ],
          },
        },
      });

    expect(a2a.status).toBe(200);
    expect(a2a.body.result.task.status.state).toBe("TASK_STATE_COMPLETED");
    expect(a2a.body.result.task.artifacts[0].metadata.caseId).toBe(
      "CASE-INC-HVAC-PROTOCOL",
    );

    const mcp = await request(app)
      .post("/mcp")
      .set("accept", "application/json, text/event-stream")
      .send({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "get_case_analysis",
          arguments: { caseId: "CASE-INC-HVAC-PROTOCOL" },
        },
      });

    expect(mcp.status).toBe(200);
    expect(mcp.text).toContain("CASE-INC-HVAC-PROTOCOL");
    expect(mcp.text).toContain("check whether the room door is open");
    expect(mcp.text).toContain("structuredContent");
  });
});
