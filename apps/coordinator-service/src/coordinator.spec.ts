import {
  complianceAssessmentSchema,
  type AssessmentRequest,
  type ComplianceAssessment,
} from "@packt-workshop/contracts";
import { describe, expect, it, vi } from "vitest";
import type { ComplianceProvider } from "./compliance-client.js";
import { WorkshopCoordinator } from "./coordinator.js";
import { createWorkshopTools } from "./mastra-tools.js";

const request: AssessmentRequest = {
  incident: {
    incidentId: "INC-42",
    machineId: "PRESS-7",
    occurredAt: "2026-08-17T08:00:00.000Z",
    severity: "critical",
    summary: "Heat and vibration anomaly",
    telemetry: {
      temperatureCelsius: 118,
      vibrationMillimetersPerSecond: 18.2,
      pressureBar: 5.4,
    },
  },
  jurisdiction: "Workshop Jurisdiction",
  correlationId: "corr-42",
};

const assessment: ComplianceAssessment = complianceAssessmentSchema.parse({
  assessmentId: "ASSESS-INC-42",
  caseId: "CASE-INC-42",
  incidentId: "INC-42",
  jurisdiction: "Workshop Jurisdiction",
  recommendation: "Isolate the machine after human review.",
  requiredActions: [
    {
      actionId: "isolate-machine",
      label: "Isolate PRESS-7",
      rationale: "Critical threshold exceeded.",
      consequential: true,
      sourceIds: ["WJ-SAFETY-12"],
    },
  ],
  sources: [
    {
      sourceId: "WJ-SAFETY-12",
      title: "Workshop Industrial Safety Code",
      jurisdiction: "Workshop Jurisdiction",
      section: "Section 12",
      effectiveFrom: "2026-01-01",
      excerpt: "Critical anomalies require isolation and operator review.",
      uri: "law://workshop/safety/12",
    },
  ],
  uncertainties: ["Personnel location is unknown."],
  status: "needs-human-review",
  generatedAt: "2026-08-17T08:00:10.000Z",
  disclaimer: "Fictional workshop material. Not legal advice.",
});

function setup() {
  const assess = vi.fn(async () => assessment);
  const provider: ComplianceProvider = { assess };
  const coordinator = new WorkshopCoordinator(provider);
  return { assess, coordinator };
}

describe("WorkshopCoordinator", () => {
  it("delegates once over the provider and creates a bounded decision surface", async () => {
    const { assess, coordinator } = setup();
    const first = await coordinator.assess(request);
    const repeated = await coordinator.assess(request);

    expect(assess).toHaveBeenCalledOnce();
    expect(first.assessment.caseId).toBe("CASE-INC-42");
    expect(first.machineState).toBe("at-risk");
    expect(first.decisionSurface.catalogId).toBe(
      "workshop://catalog/incident-decision/v1",
    );
    expect(first.auditTrail.map((event) => event.kind)).toEqual([
      "assessment-requested",
      "assessment-completed",
      "remediation-proposed",
    ]);
    coordinator.recordSpecialistGuidanceOpened("corr-42", "CASE-INC-42");
    coordinator.recordSpecialistGuidanceOpened("corr-42", "CASE-INC-42");
    expect(coordinator.audit.list("corr-42").at(-1)?.kind).toBe(
      "specialist-guidance-opened",
    );
    expect(
      coordinator.audit
        .list("corr-42")
        .filter((event) => event.kind === "specialist-guidance-opened"),
    ).toHaveLength(1);
    expect(repeated.assessment.caseId).toBe(first.assessment.caseId);
  });

  it("requires an explicit operator decision before isolating the plant", async () => {
    const { coordinator } = setup();
    await coordinator.assess(request);
    expect(coordinator.plant.get("PRESS-7")).toBe("at-risk");

    const approved = coordinator.decide({
      correlationId: request.correlationId,
      actionId: "isolate-machine",
      decision: "approve",
      operatorId: "operator-1",
    });
    const replay = coordinator.decide({
      correlationId: request.correlationId,
      actionId: "isolate-machine",
      decision: "approve",
      operatorId: "operator-1",
    });

    expect(approved.machineState).toBe("isolated");
    expect(approved.auditTrail.at(-1)?.details["explicitHumanDecision"]).toBe(
      true,
    );
    expect(replay.decision).toBe("already-decided");
  });

  it("marks the consequential Mastra tool as approval-gated", () => {
    const { coordinator } = setup();
    const tools = createWorkshopTools(coordinator);
    expect(tools.isolateMachine.requireApproval).toBe(true);
  });

  it("records an auditable failure when the specialist is unavailable", async () => {
    const coordinator = new WorkshopCoordinator({
      assess: vi.fn(async () => {
        throw new Error("deadline exceeded");
      }),
    });

    await expect(
      coordinator.assess({ ...request, correlationId: "corr-failed" }),
    ).rejects.toThrow("deadline exceeded");
    expect(coordinator.audit.list("corr-failed").at(-1)?.kind).toBe(
      "operation-failed",
    );
  });
});
