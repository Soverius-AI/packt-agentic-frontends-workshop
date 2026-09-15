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

export const facilityViewModeSchema = z.enum(["snapshot", "reading-log"]);
export type FacilityViewMode = z.infer<typeof facilityViewModeSchema>;

export const facilityViewFilterNameSchema = z.enum([
  "from",
  "to",
  "shiftManager",
  "roomId",
  "metricId",
  "condition",
]);
export type FacilityViewFilterName = z.infer<
  typeof facilityViewFilterNameSchema
>;

const nullableFilterValueSchema = z.string().min(1).nullable();
const localDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;
const facilityDateFilterValueSchema = z
  .union([
    z.literal("now"),
    z.iso.datetime(),
    z.string().regex(localDateTimePattern),
  ])
  .nullable();

export const facilityViewFiltersSchema = z
  .object({
    from: facilityDateFilterValueSchema.describe(
      'Start boundary; use "now", an ISO date-time, a browser-local date-time, or null.',
    ),
    to: facilityDateFilterValueSchema.describe(
      'End boundary; use "now", an ISO date-time, a browser-local date-time, or null.',
    ),
    shiftManager: nullableFilterValueSchema.describe(
      "Exact shift-manager name returned by list_shift_managers, or null.",
    ),
    roomId: nullableFilterValueSchema.describe(
      "Exact room ID returned by list_rooms, never an invented ID, or null.",
    ),
    metricId: nullableFilterValueSchema.describe(
      "Exact metric ID returned by list_metrics, never an invented ID, or null.",
    ),
    condition: metricConditionSchema
      .nullable()
      .describe(
        "Reading condition: normal, warning, critical, unavailable, or null. Do not use a severity field.",
      ),
  })
  .strict();
export type FacilityViewFilters = z.infer<typeof facilityViewFiltersSchema>;

export const facilityViewStateSchema = z.object({
  view: facilityViewModeSchema,
  filters: facilityViewFiltersSchema,
});
export type FacilityViewState = z.infer<typeof facilityViewStateSchema>;

export function getUserTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

const facilityViewFilterPatchSchema = facilityViewFiltersSchema
  .partial()
  .strict();

export const setViewToolSchema = z
  .object({
    view: facilityViewModeSchema.describe(
      "The facility view to show: snapshot or reading-log.",
    ),
  })
  .strict();
export type SetViewToolInput = z.infer<typeof setViewToolSchema>;

export const updateFiltersToolSchema = z
  .object({
    filters: facilityViewFilterPatchSchema.describe(
      "Only the filters to change. Omitted filters keep their current values.",
    ),
  })
  .strict();
export type UpdateFiltersToolInput = z.infer<typeof updateFiltersToolSchema>;

export const clearFiltersToolSchema = z
  .object({
    filters: z
      .array(facilityViewFilterNameSchema)
      .min(1)
      .optional()
      .describe(
        "Filter names to clear. Omit this property to clear every filter.",
      ),
  })
  .strict();
export type ClearFiltersToolInput = z.infer<typeof clearFiltersToolSchema>;

export const listRoomsToolSchema = z.object({}).strict();
export const listShiftManagersToolSchema = z.object({}).strict();
export const listConditionsToolSchema = z.object({}).strict();
export const listMetricsToolSchema = z
  .object({
    roomId: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Optional room ID returned by list_rooms. Omit it to list metrics for every room.",
      ),
  })
  .strict();
export type ListMetricsToolInput = z.infer<typeof listMetricsToolSchema>;

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

const facilityViewCommandSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("set_view"),
      ...setViewToolSchema.shape,
    })
    .strict(),
  z
    .object({
      action: z.literal("update_filters"),
      ...updateFiltersToolSchema.shape,
    })
    .strict(),
  z
    .object({
      action: z.literal("clear_filters"),
      ...clearFiltersToolSchema.shape,
    })
    .strict(),
]);
export type ConfigureFacilityView = z.infer<typeof facilityViewCommandSchema>;

export type FacilityViewAvailableOptions = {
  rooms: readonly { id: string; name: string }[];
  metrics: readonly { id: string; label: string }[];
  shiftManagers: readonly string[];
};

function resolveOptionId(
  name: "roomId" | "metricId",
  value: string,
  options: readonly { id: string }[],
): string {
  if (options.some((option) => option.id === value)) return value;
  throw new Error(
    `Unknown ${name} "${value}". Use an ID returned by the list tools.`,
  );
}

export function resolveFacilityViewAvailableOptions(
  command: ConfigureFacilityView,
  options: FacilityViewAvailableOptions,
): ConfigureFacilityView {
  if (command.action !== "update_filters") return command;

  const filters = { ...command.filters };
  if (filters.roomId) {
    filters.roomId = resolveOptionId("roomId", filters.roomId, options.rooms);
  }
  if (filters.metricId) {
    filters.metricId = resolveOptionId(
      "metricId",
      filters.metricId,
      options.metrics,
    );
  }
  if (filters.shiftManager) {
    const manager = options.shiftManagers.find(
      (candidate) => candidate === filters.shiftManager,
    );
    if (!manager) {
      throw new Error(
        `Unknown shiftManager "${filters.shiftManager}". Use one of: ${options.shiftManagers.join(", ")}.`,
      );
    }
    filters.shiftManager = manager;
  }
  return { ...command, filters };
}

export const emptyFacilityViewFilters = (): FacilityViewFilters => ({
  from: null,
  to: null,
  shiftManager: null,
  roomId: null,
  metricId: null,
  condition: null,
});

export function applyFacilityViewCommand(
  current: FacilityViewState,
  command: ConfigureFacilityView,
): FacilityViewState {
  if (command.action === "set_view") {
    return { ...current, view: command.view };
  }

  if (command.action === "update_filters") {
    const patch = command.filters;
    return {
      view: current.view,
      filters: {
        from: patch.from !== undefined ? patch.from : current.filters.from,
        to: patch.to !== undefined ? patch.to : current.filters.to,
        shiftManager:
          patch.shiftManager !== undefined
            ? patch.shiftManager
            : current.filters.shiftManager,
        roomId:
          patch.roomId !== undefined ? patch.roomId : current.filters.roomId,
        metricId:
          patch.metricId !== undefined
            ? patch.metricId
            : current.filters.metricId,
        condition:
          patch.condition !== undefined
            ? patch.condition
            : current.filters.condition,
      },
    };
  }

  if (!command.filters) {
    return { ...current, filters: emptyFacilityViewFilters() };
  }

  const filters = { ...current.filters };
  for (const filter of command.filters) filters[filter] = null;
  return { ...current, filters };
}

function toLocalDateTimeInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function resolveFacilityViewDates(
  state: FacilityViewState,
  now = new Date(),
): FacilityViewState {
  const resolveDate = (value: string | null): string | null => {
    if (value === null) return null;
    if (value === "now") return toLocalDateTimeInput(now);
    if (localDateTimePattern.test(value)) return value.slice(0, 16);
    return toLocalDateTimeInput(new Date(value));
  };

  return {
    ...state,
    filters: {
      ...state.filters,
      from: resolveDate(state.filters.from),
      to: resolveDate(state.filters.to),
    },
  };
}

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
