import { z } from "zod";

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

export const facilityViewFiltersSchema = z.object({
  from: facilityDateFilterValueSchema,
  to: facilityDateFilterValueSchema,
  shiftManager: nullableFilterValueSchema,
  roomId: nullableFilterValueSchema,
  metricId: nullableFilterValueSchema,
  condition: metricConditionSchema.nullable(),
});
export type FacilityViewFilters = z.infer<typeof facilityViewFiltersSchema>;

export const facilityViewStateSchema = z.object({
  view: facilityViewModeSchema,
  filters: facilityViewFiltersSchema,
});
export type FacilityViewState = z.infer<typeof facilityViewStateSchema>;

const facilityViewFilterPatchSchema = facilityViewFiltersSchema.partial();

export const configureFacilityViewSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set_view"),
    view: facilityViewModeSchema,
  }),
  z.object({
    action: z.literal("update_filters"),
    filters: facilityViewFilterPatchSchema,
  }),
  z.object({
    action: z.literal("clear_filters"),
    filters: z.array(facilityViewFilterNameSchema).min(1).optional(),
  }),
]);
export type ConfigureFacilityView = z.infer<typeof configureFacilityViewSchema>;

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
