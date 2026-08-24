import { z } from "zod";

export const facilityIncidentSchema = z.object({
  incidentId: z.string().min(1),
  assetId: z.string().min(1),
  occurredAt: z.iso.datetime(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  summary: z.string().min(1),
  telemetry: z.object({
    roomTemperatureCelsius: z.number(),
    outsideTemperatureCelsius: z.number(),
    trendDurationMinutes: z.number().int().positive(),
    doorState: z.enum(["open", "closed", "unknown"]),
  }),
});

export type FacilityIncident = z.infer<typeof facilityIncidentSchema>;

export const ROOM_HVAC_INCIDENT: FacilityIncident =
  facilityIncidentSchema.parse({
    incidentId: "INC-HVAC-03",
    assetId: "ROOM-3-HVAC",
    occurredAt: "2026-08-17T08:00:00.000Z",
    severity: "medium",
    summary:
      "The room temperature has risen continuously for 30 minutes and now matches the outside temperature.",
    telemetry: {
      roomTemperatureCelsius: 29,
      outsideTemperatureCelsius: 29,
      trendDurationMinutes: 30,
      doorState: "unknown",
    },
  });

export const alarmStateSchema = z.enum(["not-raised", "raised"]);
export type AlarmState = z.infer<typeof alarmStateSchema>;
