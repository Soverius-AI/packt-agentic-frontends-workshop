import { describe, expect, it } from "vitest";
import {
  complianceAssessmentSchema,
  machineIncidentSchema,
  WORKSHOP_LEGAL_DISCLAIMER,
} from "./index.js";

describe("workshop contracts", () => {
  it("accepts a deterministic machine incident", () => {
    expect(
      machineIncidentSchema.parse({
        incidentId: "INC-017",
        machineId: "M17",
        occurredAt: "2026-09-16T13:05:00.000Z",
        severity: "critical",
        summary: "Abnormal vibration and rising temperature",
        telemetry: {
          temperatureCelsius: 96.4,
          vibrationMillimetersPerSecond: 18.2,
          pressureBar: 4.8,
        },
      }),
    ).toMatchObject({ machineId: "M17", severity: "critical" });
  });

  it("rejects an assessment without evidence", () => {
    expect(() =>
      complianceAssessmentSchema.parse({
        assessmentId: "ASSESS-017",
        caseId: "CASE-017",
        incidentId: "INC-017",
        jurisdiction: "Workshop Jurisdiction",
        recommendation: "Escalate for human review.",
        requiredActions: [],
        sources: [],
        uncertainties: [],
        status: "needs-human-review",
        generatedAt: "2026-09-16T13:05:10.000Z",
        disclaimer: WORKSHOP_LEGAL_DISCLAIMER,
      }),
    ).toThrow();
  });

  it("accepts the room climate trend needed by the A2A facilities specialist", () => {
    const incident = machineIncidentSchema.parse({
      incidentId: "INC-HVAC-03",
      machineId: "ROOM-3-HVAC",
      occurredAt: "2026-08-17T08:00:00.000Z",
      severity: "medium",
      summary: "Room temperature now matches the outside temperature.",
      telemetry: {
        temperatureCelsius: 29,
        outsideTemperatureCelsius: 29,
        trendDurationMinutes: 30,
        doorState: "unknown",
        vibrationMillimetersPerSecond: 0,
        pressureBar: 0,
      },
    });

    expect(incident.telemetry).toMatchObject({
      outsideTemperatureCelsius: 29,
      trendDurationMinutes: 30,
      doorState: "unknown",
    });
  });
});
