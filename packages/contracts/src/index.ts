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

export const raiseAlarmRequestSchema = z.object({
  operatorId: z.string().min(1).default("night-reception"),
});
export type RaiseAlarmRequest = z.infer<typeof raiseAlarmRequestSchema>;

export const alarmActionRequestSchema = z.object({
  state: z.enum(["acknowledged", "resolved"]),
  operatorId: z.string().min(1).default("night-reception"),
});
export type AlarmActionRequest = z.infer<typeof alarmActionRequestSchema>;
