import {
  decisionSurfaceSchema,
  operatorDecisionResultSchema,
  operatorDecisionSchema,
  workflowResultSchema,
  type AssessmentRequest,
  type OperatorDecision,
  type OperatorDecisionResult,
  type WorkflowResult,
} from "@packt-workshop/contracts";
import { AuditStore } from "./audit-store.js";
import type { ComplianceProvider } from "./compliance-client.js";
import { PlantSimulator } from "./plant-simulator.js";

export class WorkshopCoordinator {
  readonly #workflows = new Map<string, WorkflowResult>();
  readonly #decisions = new Map<string, OperatorDecisionResult>();
  readonly #machineIds = new Map<string, string>();

  constructor(
    private readonly compliance: ComplianceProvider,
    readonly audit = new AuditStore(),
    readonly plant = new PlantSimulator(),
  ) {}

  async assess(request: AssessmentRequest): Promise<WorkflowResult> {
    const existing = this.#workflows.get(request.correlationId);
    if (existing) return structuredClone(existing);

    this.plant.flagRisk(request.incident.machineId);
    this.#machineIds.set(request.correlationId, request.incident.machineId);
    this.audit.append(request.correlationId, {
      actor: "primary-agent",
      kind: "assessment-requested",
      details: {
        protocol: "A2A/1.0",
        incidentId: request.incident.incidentId,
        machineId: request.incident.machineId,
      },
    });

    try {
      const assessment = await this.compliance.assess(request);
      this.audit.append(request.correlationId, {
        actor: "compliance-agent",
        kind: "assessment-completed",
        details: {
          caseId: assessment.caseId,
          sourceCount: assessment.sources.length,
        },
      });
      this.audit.append(request.correlationId, {
        actor: "primary-agent",
        kind: "remediation-proposed",
        details: {
          caseId: assessment.caseId,
          consequentialActions: assessment.requiredActions
            .filter((action) => action.consequential)
            .map((action) => action.actionId),
        },
      });

      const decisionSurface = decisionSurfaceSchema.parse({
        surfaceId: `decision-${assessment.caseId}`,
        catalogId: "workshop://catalog/incident-decision/v1",
        assessment,
        components: [
          { id: "risk", component: "RiskSummary" },
          { id: "actions", component: "RequiredActionList" },
          { id: "evidence", component: "EvidenceList" },
          { id: "uncertainty", component: "UncertaintyNotice" },
          { id: "specialist-guidance", component: "OpenSpecialistGuidance" },
          { id: "approval", component: "ApprovalControls" },
        ],
      });
      const result = workflowResultSchema.parse({
        correlationId: request.correlationId,
        assessment,
        decisionSurface,
        machineState: this.plant.get(request.incident.machineId),
        auditTrail: this.audit.list(request.correlationId),
      });
      this.#workflows.set(request.correlationId, result);
      return structuredClone(result);
    } catch (error) {
      this.audit.append(request.correlationId, {
        actor: "system",
        kind: "operation-failed",
        details: { operation: "compliance-assessment" },
      });
      throw error;
    }
  }

  decide(value: OperatorDecision): OperatorDecisionResult {
    const decision = operatorDecisionSchema.parse(value);
    const workflow = this.#workflows.get(decision.correlationId);
    if (!workflow) throw new Error("Unknown workflow correlation ID.");
    const action = workflow.assessment.requiredActions.find(
      (candidate) => candidate.actionId === decision.actionId,
    );
    if (!action) throw new Error("Unknown remediation action.");
    if (!action.consequential) {
      throw new Error(
        "Only consequential actions require an operator decision.",
      );
    }

    const key = `${decision.correlationId}:${decision.actionId}`;
    const existing = this.#decisions.get(key);
    if (existing) {
      return operatorDecisionResultSchema.parse({
        ...existing,
        decision: "already-decided",
        auditTrail: this.audit.list(decision.correlationId),
      });
    }

    if (
      decision.decision === "approve" &&
      decision.actionId === "isolate-machine"
    ) {
      const machineId = this.#machineIds.get(decision.correlationId);
      if (machineId) this.plant.isolate(machineId);
    }
    this.audit.append(decision.correlationId, {
      actor: "operator",
      kind:
        decision.decision === "approve"
          ? "remediation-approved"
          : "remediation-rejected",
      details: {
        actionId: decision.actionId,
        operatorId: decision.operatorId,
        explicitHumanDecision: true,
      },
    });
    const machineId = this.#machineIds.get(decision.correlationId);
    const result = operatorDecisionResultSchema.parse({
      correlationId: decision.correlationId,
      actionId: decision.actionId,
      decision: decision.decision === "approve" ? "approved" : "rejected",
      machineState: machineId
        ? this.plant.get(machineId)
        : workflow.machineState,
      auditTrail: this.audit.list(decision.correlationId),
    });
    this.#decisions.set(key, result);
    return structuredClone(result);
  }

  recordSpecialistGuidanceOpened(correlationId: string, caseId: string): void {
    const workflow = this.#workflows.get(correlationId);
    if (!workflow || workflow.assessment.caseId !== caseId) {
      throw new Error("The case does not belong to this workflow.");
    }
    const alreadyRecorded = this.audit
      .list(correlationId)
      .some(
        (event) =>
          event.kind === "specialist-guidance-opened" &&
          event.details.caseId === caseId,
      );
    if (alreadyRecorded) return;
    this.audit.append(correlationId, {
      actor: "operator",
      kind: "specialist-guidance-opened",
      details: { caseId, protocol: "MCP Apps" },
    });
  }
}
