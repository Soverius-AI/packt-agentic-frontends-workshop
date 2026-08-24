import { describe, expect, it } from "vitest";
import { facilityIncidentSchema, ROOM_HVAC_INCIDENT } from "./index.js";

describe("Stage 1 facility contracts", () => {
  it("provides deterministic room climate telemetry", () => {
    expect(ROOM_HVAC_INCIDENT).toMatchObject({
      incidentId: "INC-HVAC-03",
      assetId: "ROOM-3-HVAC",
      telemetry: {
        roomTemperatureCelsius: 29,
        outsideTemperatureCelsius: 29,
        trendDurationMinutes: 30,
        doorState: "unknown",
      },
    });
  });

  it("rejects an invalid trend duration", () => {
    expect(() =>
      facilityIncidentSchema.parse({
        ...ROOM_HVAC_INCIDENT,
        telemetry: {
          ...ROOM_HVAC_INCIDENT.telemetry,
          trendDurationMinutes: 0,
        },
      }),
    ).toThrow();
  });
});
