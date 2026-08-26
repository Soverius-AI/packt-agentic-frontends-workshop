import { describe, expect, it } from "vitest";
import {
  applyFacilityViewCommand,
  alarmActionRequestSchema,
  configureFacilityViewSchema,
  type FacilityViewState,
  facilityDashboardSchema,
  metricUpdateEventSchema,
  raiseAlarmRequestSchema,
  resolveFacilityViewDates,
  resolveFacilityViewAvailableOptions,
} from "./index.js";

describe("Stage 1 facility contracts", () => {
  it("describes rooms containing independently alarmable metrics", () => {
    const dashboard = facilityDashboardSchema.parse({
      siteName: "Soverius Chocolate Bar",
      generatedAt: "2026-08-24T18:00:00.000Z",
      activeAlarmCount: 0,
      shiftManagers: ["Charles Bond", "Denise Weber", "Martin Thompson"],
      rooms: [
        {
          id: "cooling-room",
          name: "Cooling room",
          areaType: "Climate-controlled storage",
          description: "Chocolate conditioning and storage before packaging.",
          metrics: [
            {
              id: "cooling-air-temperature",
              roomId: "cooling-room",
              equipmentName: null,
              name: "Air temperature",
              kind: "numeric",
              unit: "°C",
              currentNumericValue: 21.2,
              currentTextValue: null,
              shiftManagerName: "Denise Weber",
              condition: "warning",
              trend: "Rising for 30 min",
              target: "16–18 °C",
              detail: "Approaching the adjacent packaging hall temperature.",
              updatedAt: "2026-08-24T18:00:00.000Z",
              activeAlarm: null,
            },
          ],
        },
      ],
    });

    expect(dashboard.rooms[0]?.metrics[0]?.condition).toBe("warning");
  });

  it("defaults alarm actions to the workshop night receptionist", () => {
    expect(raiseAlarmRequestSchema.parse({}).operatorId).toBe(
      "night-reception",
    );
    expect(
      alarmActionRequestSchema.parse({ state: "resolved" }).operatorId,
    ).toBe("night-reception");
  });

  it("validates individual live metric updates", () => {
    const metric = facilityDashboardSchema.parse({
      siteName: "Soverius Chocolate Bar",
      generatedAt: "2026-08-24T18:00:00.000Z",
      activeAlarmCount: 0,
      shiftManagers: ["Charles Bond", "Denise Weber", "Martin Thompson"],
      rooms: [
        {
          id: "cooling-room",
          name: "Cooling room",
          areaType: "Storage",
          description: "Chocolate storage.",
          metrics: [
            {
              id: "cooling-air-temperature",
              roomId: "cooling-room",
              equipmentName: null,
              name: "Air temperature",
              kind: "numeric",
              unit: "°C",
              currentNumericValue: 21.4,
              currentTextValue: null,
              shiftManagerName: "Denise Weber",
              condition: "warning",
              trend: "Rising",
              target: "16–18 °C",
              detail: "Updated sensor value.",
              updatedAt: "2026-08-24T18:00:00.000Z",
              activeAlarm: null,
            },
          ],
        },
      ],
    }).rooms[0]!.metrics[0]!;

    expect(
      metricUpdateEventSchema.parse({ type: "metric.updated", metric }).metric
        .id,
    ).toBe("cooling-air-temperature");
  });

  it("patches only the requested facility view fields", () => {
    const current: FacilityViewState = {
      view: "reading-log",
      filters: {
        from: "2026-08-25T08:00",
        to: null,
        shiftManager: "Charles Bond",
        roomId: "cooling-room",
        metricId: null,
        condition: "warning",
      },
    };
    const command = configureFacilityViewSchema.parse({
      action: "update_filters",
      filters: { from: "now" },
    });

    expect(applyFacilityViewCommand(current, command)).toEqual({
      ...current,
      filters: { ...current.filters, from: "now" },
    });
  });

  it("advertises a root object schema and rejects combined action payloads", () => {
    const jsonSchema = configureFacilityViewSchema[
      "~standard"
    ].jsonSchema.input({ target: "draft-07" }) as {
      type?: string;
      properties?: Record<string, unknown>;
      required?: string[];
    };

    expect(jsonSchema.type).toBe("object");
    expect(Object.keys(jsonSchema.properties ?? {})).toEqual([
      "action",
      "view",
      "filters",
    ]);
    expect(jsonSchema.required).toContain("action");
    expect(
      configureFacilityViewSchema.safeParse({
        update_filters: {
          condition: "warning",
          roomId: "Cooling room",
        },
        set_view: "reading-log",
      }).success,
    ).toBe(false);
    expect(
      configureFacilityViewSchema.safeParse({
        action: "update_filters",
        filters: { roomId: "room-cooling-01", severity: "warning" },
      }).success,
    ).toBe(false);
  });

  it("uses action as the authority and removes irrelevant provider-supplied fields", () => {
    expect(
      configureFacilityViewSchema.parse({
        action: "set_view",
        view: "reading-log",
        filters: { roomId: null, condition: null },
      }),
    ).toEqual({ action: "set_view", view: "reading-log" });
    expect(
      configureFacilityViewSchema.parse({
        action: "update_filters",
        view: "reading-log",
        filters: { condition: "warning" },
      }),
    ).toEqual({ action: "update_filters", filters: { condition: "warning" } });
  });

  it("resolves bounded option labels and aliases without accepting unknown IDs", () => {
    const command = configureFacilityViewSchema.parse({
      action: "update_filters",
      filters: { roomId: "ROOM_COOLING" },
    });
    const options = {
      rooms: [
        { id: "cooling-room", name: "Cooling room" },
        { id: "packaging-hall", name: "Packaging hall" },
      ],
      metrics: [
        {
          id: "cooling-air-temperature",
          label: "Cooling room · Air temperature",
        },
      ],
      shiftManagers: ["Denise Weber"],
    };

    expect(resolveFacilityViewAvailableOptions(command, options)).toEqual({
      action: "update_filters",
      filters: { roomId: "cooling-room" },
    });

    expect(() =>
      resolveFacilityViewAvailableOptions(
        {
          action: "update_filters",
          filters: { roomId: "room-cooling-01" },
        },
        options,
      ),
    ).toThrow(/Unknown roomId.*cooling-room/);
  });

  it("sets the view without changing any filters", () => {
    const current: FacilityViewState = {
      view: "snapshot",
      filters: {
        from: "2026-08-25T08:00",
        to: null,
        shiftManager: "Charles Bond",
        roomId: "cooling-room",
        metricId: null,
        condition: "warning",
      },
    };

    expect(
      applyFacilityViewCommand(current, {
        action: "set_view",
        view: "reading-log",
      }),
    ).toEqual({ ...current, view: "reading-log" });
  });

  it("clears selected filters or all filters without changing the view", () => {
    const current: FacilityViewState = {
      view: "reading-log",
      filters: {
        from: "2026-08-25T08:00",
        to: "2026-08-25T16:00",
        shiftManager: "Charles Bond",
        roomId: "cooling-room",
        metricId: "cooling-air-temperature",
        condition: "warning",
      },
    };

    expect(
      applyFacilityViewCommand(current, {
        action: "clear_filters",
        filters: ["from"],
      }),
    ).toEqual({
      ...current,
      filters: { ...current.filters, from: null },
    });
    expect(
      Object.values(
        applyFacilityViewCommand(current, { action: "clear_filters" }).filters,
      ),
    ).toEqual([null, null, null, null, null, null]);
  });

  it("resolves now at execution time without changing other filters", () => {
    const state: FacilityViewState = {
      view: "reading-log",
      filters: {
        from: "now",
        to: "2026-08-25T16:00",
        shiftManager: "Charles Bond",
        roomId: "cooling-room",
        metricId: null,
        condition: "warning",
      },
    };

    expect(
      resolveFacilityViewDates(state, new Date(2026, 7, 26, 9, 7)),
    ).toEqual({
      ...state,
      filters: { ...state.filters, from: "2026-08-26T09:07" },
    });
  });
});
