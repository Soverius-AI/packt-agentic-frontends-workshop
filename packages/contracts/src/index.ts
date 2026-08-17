import { z } from "zod";

export const machineIncidentSchema = z.object({
  incidentId: z.string().min(1),
  machineId: z.string().min(1),
  occurredAt: z.iso.datetime(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  summary: z.string().min(1),
  telemetry: z.object({
    temperatureCelsius: z.number(),
    vibrationMillimetersPerSecond: z.number().nonnegative(),
    pressureBar: z.number().nonnegative(),
    outsideTemperatureCelsius: z.number().optional(),
    trendDurationMinutes: z.number().int().positive().optional(),
    doorState: z.enum(["open", "closed", "unknown"]).optional(),
  }),
});

export type MachineIncident = z.infer<typeof machineIncidentSchema>;

export const legalSourceSchema = z.object({
  sourceId: z.string().min(1),
  title: z.string().min(1),
  jurisdiction: z.string().min(1),
  section: z.string().min(1),
  effectiveFrom: z.iso.date(),
  excerpt: z.string().min(1),
  uri: z.string().min(1),
});

export type LegalSource = z.infer<typeof legalSourceSchema>;

export const requiredActionSchema = z.object({
  actionId: z.string().min(1),
  label: z.string().min(1),
  rationale: z.string().min(1),
  consequential: z.boolean(),
  sourceIds: z.array(z.string().min(1)).min(1),
});

export type RequiredAction = z.infer<typeof requiredActionSchema>;

export const complianceAssessmentSchema = z.object({
  assessmentId: z.string().min(1),
  caseId: z.string().min(1),
  incidentId: z.string().min(1),
  jurisdiction: z.string().min(1),
  recommendation: z.string().min(1),
  requiredActions: z.array(requiredActionSchema),
  sources: z.array(legalSourceSchema).min(1),
  uncertainties: z.array(z.string().min(1)),
  status: z.enum(["complete", "needs-human-review"]),
  generatedAt: z.iso.datetime(),
  disclaimer: z.string().min(1),
});

export type ComplianceAssessment = z.infer<typeof complianceAssessmentSchema>;

export const assessmentRequestSchema = z.object({
  incident: machineIncidentSchema,
  jurisdiction: z.string().min(1).default("Workshop Jurisdiction"),
  correlationId: z.string().min(1),
});

export type AssessmentRequest = z.infer<typeof assessmentRequestSchema>;

export const auditEventSchema = z.object({
  eventId: z.string().min(1),
  correlationId: z.string().min(1),
  occurredAt: z.iso.datetime(),
  actor: z.enum(["operator", "primary-agent", "compliance-agent", "system"]),
  kind: z.enum([
    "assessment-requested",
    "assessment-completed",
    "specialist-guidance-opened",
    "remediation-proposed",
    "remediation-approved",
    "remediation-rejected",
    "operation-failed",
  ]),
  details: z.record(z.string(), z.unknown()),
});

export type AuditEvent = z.infer<typeof auditEventSchema>;

export const decisionSurfaceSchema = z.object({
  surfaceId: z.string().min(1),
  catalogId: z.literal("workshop://catalog/incident-decision/v1"),
  assessment: complianceAssessmentSchema,
  components: z.array(
    z.discriminatedUnion("component", [
      z.object({ id: z.string(), component: z.literal("RiskSummary") }),
      z.object({ id: z.string(), component: z.literal("RequiredActionList") }),
      z.object({ id: z.string(), component: z.literal("EvidenceList") }),
      z.object({ id: z.string(), component: z.literal("UncertaintyNotice") }),
      z.object({
        id: z.string(),
        component: z.literal("OpenSpecialistGuidance"),
      }),
      z.object({ id: z.string(), component: z.literal("ApprovalControls") }),
    ]),
  ),
});

export type DecisionSurface = z.infer<typeof decisionSurfaceSchema>;

export const workflowResultSchema = z.object({
  correlationId: z.string().min(1),
  assessment: complianceAssessmentSchema,
  decisionSurface: decisionSurfaceSchema,
  machineState: z.enum(["running", "at-risk", "isolated"]),
  auditTrail: z.array(auditEventSchema),
});

export type WorkflowResult = z.infer<typeof workflowResultSchema>;

export const operatorDecisionSchema = z.object({
  correlationId: z.string().min(1),
  actionId: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
  operatorId: z.string().min(1),
});

export type OperatorDecision = z.infer<typeof operatorDecisionSchema>;

export const operatorDecisionResultSchema = z.object({
  correlationId: z.string().min(1),
  actionId: z.string().min(1),
  decision: z.enum(["approved", "rejected", "already-decided"]),
  machineState: z.enum(["running", "at-risk", "isolated"]),
  auditTrail: z.array(auditEventSchema),
});

export type OperatorDecisionResult = z.infer<
  typeof operatorDecisionResultSchema
>;

export const WORKSHOP_LEGAL_DISCLAIMER =
  "Fictional workshop material for demonstrating traceable decision support. It is not legal advice.";

export const WORKSHOP_EVIDENCE_DISCLAIMER =
  "Fictional workshop policies for demonstrating traceable decision support. They are not operational or legal advice.";
