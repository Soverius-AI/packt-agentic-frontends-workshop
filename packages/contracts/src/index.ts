import { z } from "zod";
import {
  datasetMetadataSchema,
  historianDatasetSchema,
  DATASET_ROW_LIMIT,
} from "./historian-dataset.js";
export * from "./historian-dataset.js";
export * from "./facility-catalog.js";
export * from "./a2ui-composition.js";
export * from "./result-table.js";

export const metricConditionSchema = z.enum([
  "normal",
  "warning",
  "critical",
  "unavailable",
]);
export type MetricCondition = z.infer<typeof metricConditionSchema>;

export const metricKindSchema = z.enum(["numeric", "state"]);
export type MetricKind = z.infer<typeof metricKindSchema>;

export const alarmStateSchema = z.enum(["raised", "acknowledged", "resolved"]);
export type AlarmState = z.infer<typeof alarmStateSchema>;

export const metricAlarmSchema = z.object({
  id: z.string().min(1),
  metricId: z.string().min(1),
  state: alarmStateSchema,
  raisedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  operatorId: z.string().min(1),
});
export type MetricAlarm = z.infer<typeof metricAlarmSchema>;

export const alarmApprovalToolSchema = z
  .object({
    metricId: z
      .string()
      .min(1)
      .describe("Exact metric ID returned by list_metrics."),
    metricName: z
      .string()
      .min(1)
      .describe("Exact metric name returned by list_metrics."),
    reason: z
      .string()
      .trim()
      .min(1)
      .max(500)
      .describe("Concise reason shown to the operator for review."),
  })
  .strict();
export type AlarmApprovalToolInput = z.infer<typeof alarmApprovalToolSchema>;

export const alarmApprovalDecisionSchema = z.enum(["approved", "rejected"]);
export type AlarmApprovalDecision = z.infer<typeof alarmApprovalDecisionSchema>;

export const alarmApprovalRequestSchema = z
  .object({
    correlationId: z.uuid(),
    proposal: alarmApprovalToolSchema,
    decision: alarmApprovalDecisionSchema,
    operatorId: z.string().trim().min(1).max(100),
  })
  .strict();
export type AlarmApprovalRequest = z.infer<typeof alarmApprovalRequestSchema>;

export const alarmApprovalAuditEntrySchema = z
  .object({
    correlationId: z.uuid(),
    action: z.literal("raise-alarm"),
    metricId: z.string().min(1),
    metricName: z.string().min(1),
    reason: z.string().min(1),
    decision: alarmApprovalDecisionSchema,
    operatorId: z.string().min(1),
    decidedAt: z.iso.datetime(),
    outcome: z.enum(["executed", "not-executed", "failed"]),
    alarmId: z.string().min(1).nullable(),
    error: z.string().min(1).nullable(),
  })
  .strict();
export type AlarmApprovalAuditEntry = z.infer<
  typeof alarmApprovalAuditEntrySchema
>;

export const alarmApprovalAuditSchema = z.object({
  entries: z.array(alarmApprovalAuditEntrySchema).max(100),
});
export type AlarmApprovalAudit = z.infer<typeof alarmApprovalAuditSchema>;

export const metricSummarySchema = z.object({
  id: z.string().min(1),
  roomId: z.string().min(1),
  equipmentName: z.string().nullable(),
  name: z.string().min(1),
  kind: metricKindSchema,
  unit: z.string(),
  currentNumericValue: z.number().nullable(),
  currentTextValue: z.string().nullable(),
  shiftManagerName: z.string().min(1),
  condition: metricConditionSchema,
  trend: z.string().min(1),
  target: z.string().min(1),
  detail: z.string().min(1),
  updatedAt: z.iso.datetime(),
  activeAlarm: metricAlarmSchema.nullable(),
});
export type MetricSummary = z.infer<typeof metricSummarySchema>;

export const roomSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  areaType: z.string().min(1),
  description: z.string().min(1),
  metrics: z.array(metricSummarySchema),
});
export type RoomSummary = z.infer<typeof roomSummarySchema>;

export const facilityDashboardSchema = z.object({
  siteName: z.string().min(1),
  generatedAt: z.iso.datetime(),
  activeAlarmCount: z.number().int().nonnegative(),
  shiftManagers: z.array(z.string().min(1)),
  rooms: z.array(roomSummarySchema),
});
export type FacilityDashboard = z.infer<typeof facilityDashboardSchema>;

export const metricUpdateEventSchema = z.object({
  type: z.literal("metric.updated"),
  metric: metricSummarySchema,
});
export type MetricUpdateEvent = z.infer<typeof metricUpdateEventSchema>;

export const metricReadingSchema = z.object({
  recordedAt: z.iso.datetime(),
  numericValue: z.number().nullable(),
  textValue: z.string().nullable(),
  shiftManagerName: z.string().min(1),
});
export type MetricReading = z.infer<typeof metricReadingSchema>;

export const metricHistorySchema = z.object({
  metric: metricSummarySchema.omit({ activeAlarm: true }),
  readings: z.array(metricReadingSchema),
});
export type MetricHistory = z.infer<typeof metricHistorySchema>;

export const facilityReadingEntrySchema = z.object({
  id: z.number().int().positive(),
  recordedAt: z.iso.datetime(),
  roomId: z.string().min(1),
  roomName: z.string().min(1),
  metricId: z.string().min(1),
  metricName: z.string().min(1),
  unit: z.string(),
  numericValue: z.number().nullable(),
  textValue: z.string().nullable(),
  shiftManagerName: z.string().min(1),
  condition: metricConditionSchema,
});
export type FacilityReadingEntry = z.infer<typeof facilityReadingEntrySchema>;

export const facilityReadingPageSchema = z.object({
  entries: z.array(facilityReadingEntrySchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});
export type FacilityReadingPage = z.infer<typeof facilityReadingPageSchema>;

export const queryHistorianToolSchema = z
  .object({
    question: z
      .string()
      .trim()
      .min(1)
      .max(4_000)
      .describe(
        "The operator's exact historian question. A dedicated workflow step generates SQL from it.",
      ),
  })
  .strict();
export type QueryHistorianToolInput = z.infer<typeof queryHistorianToolSchema>;

// The ordinary tool and the workflow deliberately share the same narrow input.
export const historianQueryInputSchema = queryHistorianToolSchema;
export type HistorianQueryInput = QueryHistorianToolInput;

export const sqlReviewSchema = z
  .object({
    approved: z.boolean(),
    summary: z.string().trim().min(1).max(1_000),
    concerns: z.array(z.string().trim().min(1).max(500)).max(10),
  })
  .strict();
export type SqlReview = z.infer<typeof sqlReviewSchema>;

const historianToolResultBaseSchema = z.object({
  sql: z.string(),
  explanation: z.string(),
  question: z.string(),
  review: sqlReviewSchema,
  policyVersion: z.string(),
});

export const historianToolResultSchema = z.discriminatedUnion("status", [
  historianToolResultBaseSchema
    .extend({
      status: z.literal("executed"),
      entries: z.array(facilityReadingEntrySchema).max(200),
      dataset: datasetMetadataSchema.optional(),
      rowCount: z.number().int().nonnegative().max(DATASET_ROW_LIMIT),
      truncated: z.boolean(),
      durationMs: z.number().int().nonnegative(),
    })
    .strict(),
  historianToolResultBaseSchema
    .extend({
      status: z.literal("rejected"),
      stage: z.enum(["reviewer", "validator", "execution"]),
      code: z.string().min(1),
      message: z.string().min(1),
    })
    .strict(),
]);
export type HistorianToolResult = z.infer<typeof historianToolResultSchema>;

// The backend returns the rows with execution; the workflow never fetches them again.
export const historianExecutionResultSchema = z.discriminatedUnion("status", [
  historianToolResultSchema.options[0].extend({ data: historianDatasetSchema }),
  historianToolResultSchema.options[1],
]);
export type HistorianExecutionResult = z.infer<
  typeof historianExecutionResultSchema
>;

export const historianValidationRequestSchema = z
  .object({
    sql: z.string().trim().min(1).max(12_000),
  })
  .strict();
export const historianValidationResultSchema = z.discriminatedUnion(
  "approved",
  [
    z.object({ approved: z.literal(true), policyVersion: z.string() }),
    z.object({
      approved: z.literal(false),
      policyVersion: z.string(),
      code: z.string(),
      message: z.string(),
    }),
  ],
);
export type HistorianValidationResult = z.infer<
  typeof historianValidationResultSchema
>;

export const historianExecutionRequestSchema = z
  .object({
    question: z.string().trim().min(1).max(4_000),
    sql: z.string().trim().min(1).max(12_000),
    explanation: z.string().trim().min(1).max(1_000),
    review: sqlReviewSchema,
  })
  .strict();
export type HistorianExecutionRequest = z.infer<
  typeof historianExecutionRequestSchema
>;

export const raiseAlarmRequestSchema = z.object({
  operatorId: z.string().min(1).default("night-reception"),
});
export type RaiseAlarmRequest = z.infer<typeof raiseAlarmRequestSchema>;

export const alarmActionRequestSchema = z.object({
  state: z.enum(["acknowledged", "resolved"]),
  operatorId: z.string().min(1).default("night-reception"),
});
export type AlarmActionRequest = z.infer<typeof alarmActionRequestSchema>;

export * from "./chat.js";
