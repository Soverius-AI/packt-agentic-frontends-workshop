import { describe, expect, it } from "vitest";
import { assessIncident } from "./compliance-domain.js";

describe("assessIncident", () => {
  it("creates a deterministic, cited case that requires human review", () => {
    const assessment = assessIncident({
      incident: {
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
      },
      jurisdiction: "Workshop Jurisdiction",
      correlationId: "corr-017",
    });

    expect(assessment.caseId).toBe("CASE-INC-017");
    expect(assessment.generatedAt).toBe("2026-09-16T13:05:10.000Z");
    expect(assessment.status).toBe("needs-human-review");
    expect(assessment.sources).toHaveLength(3);
    expect(
      assessment.requiredActions.some((action) => action.consequential),
    ).toBe(true);
  });

  it("returns a receptionist-friendly conditional HVAC runbook", () => {
    const assessment = assessIncident({
      incident: {
        incidentId: "INC-HVAC-03",
        machineId: "ROOM-3-HVAC",
        occurredAt: "2026-08-17T08:00:00.000Z",
        severity: "medium",
        summary:
          "The room temperature has risen continuously for 30 minutes and now matches the outside temperature.",
        telemetry: {
          temperatureCelsius: 29,
          outsideTemperatureCelsius: 29,
          trendDurationMinutes: 30,
          doorState: "unknown",
          vibrationMillimetersPerSecond: 0,
          pressureBar: 0,
        },
      },
      jurisdiction: "Workshop Jurisdiction",
      correlationId: "corr-hvac-03",
    });

    expect(assessment.caseId).toBe("CASE-INC-HVAC-03");
    expect(assessment.recommendation).toContain(
      "check whether the room door is open",
    );
    expect(assessment.recommendation).toContain(
      "call the maintenance electrician",
    );
    expect(assessment.requiredActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: "close-room-door",
          consequential: false,
        }),
        expect.objectContaining({
          actionId: "review-alarm",
          consequential: true,
        }),
      ]),
    );
    expect(assessment.sources.map((source) => source.sourceId)).toEqual([
      "FAC-RUNBOOK-3",
      "FAC-ALARM-2",
    ]);
  });
});
