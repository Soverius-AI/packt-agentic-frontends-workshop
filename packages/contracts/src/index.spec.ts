import { describe, expect, it } from "vitest";
import {
  applyFacilityViewCommand,
  alarmActionRequestSchema,
  clearFiltersToolSchema,
  type FacilityViewState,
  facilityDashboardSchema,
  metricUpdateEventSchema,
  listConditionsToolSchema,
  listMetricsToolSchema,
  listRoomsToolSchema,
  listShiftManagersToolSchema,
  historianToolResultSchema,
  queryHistorianToolSchema,
  raiseAlarmRequestSchema,
  resolveFacilityViewDates,
  resolveFacilityViewAvailableOptions,
  setViewToolSchema,
  updateFiltersToolSchema,
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
    const input = updateFiltersToolSchema.parse({
      filters: { from: "now" },
    });

    expect(
      applyFacilityViewCommand(current, {
        action: "update_filters",
        ...input,
      }),
    ).toEqual({
      ...current,
      filters: { ...current.filters, from: "now" },
    });
  });

  it("advertises focused root-object schemas for mutations and catalog reads", () => {
    const properties = (schema: typeof setViewToolSchema) =>
      schema["~standard"].jsonSchema.input({ target: "draft-07" }) as {
        type?: string;
        properties?: Record<string, unknown>;
      };

    expect(properties(setViewToolSchema)).toMatchObject({
      type: "object",
      properties: { view: expect.anything() },
    });
    expect(
      updateFiltersToolSchema["~standard"].jsonSchema.input({
        target: "draft-07",
      }),
    ).toMatchObject({
      type: "object",
      properties: { filters: expect.anything() },
    });
    expect(
      clearFiltersToolSchema["~standard"].jsonSchema.input({
        target: "draft-07",
      }),
    ).toMatchObject({
      type: "object",
      properties: { filters: expect.anything() },
    });
    for (const schema of [
      listRoomsToolSchema,
      listShiftManagersToolSchema,
      listConditionsToolSchema,
    ]) {
      expect(
        schema["~standard"].jsonSchema.input({ target: "draft-07" }),
      ).toMatchObject({ type: "object", properties: {} });
    }
    expect(
      listMetricsToolSchema["~standard"].jsonSchema.input({
        target: "draft-07",
      }),
    ).toMatchObject({
      type: "object",
      properties: { roomId: expect.anything() },
    });
    expect(
      updateFiltersToolSchema.safeParse({
        filters: { roomId: "room-cooling-01", severity: "warning" },
      }).success,
    ).toBe(false);
  });

  it("rejects parameters that belong to a different frontend tool", () => {
    expect(
      setViewToolSchema.safeParse({
        view: "reading-log",
        filters: { roomId: null, condition: null },
      }).success,
    ).toBe(false);
    expect(
      updateFiltersToolSchema.safeParse({
        view: "reading-log",
        filters: { condition: "warning" },
      }).success,
    ).toBe(false);
  });

  it("defines the single generated-SQL tool and its bounded result", () => {
    expect(
      queryHistorianToolSchema.parse({
        sql: "SELECT manager, MAX(numeric_value) FROM historian_readings GROUP BY manager",
        explanation: "Compare each manager's maximum reading.",
      }),
    ).toMatchObject({ sql: expect.stringContaining("historian_readings") });

    expect(
      historianToolResultSchema.parse({
        status: "executed",
        question: "Compare the managers.",
        sql: "SELECT 1",
        explanation: "Example.",
        review: { approved: true, summary: "Matches.", concerns: [] },
        policyVersion: "historian-v1",
        columns: ["value"],
        rows: [[1]],
        rowCount: 1,
        truncated: false,
        durationMs: 2,
      }).status,
    ).toBe("executed");

    expect(
      queryHistorianToolSchema.safeParse({
        sql: "SELECT 1",
        explanation: "Example.",
        question: "This belongs to the execution context, not the tool input.",
      }).success,
    ).toBe(false);
  });

  it("resolves bounded option labels and aliases without accepting unknown IDs", () => {
    const input = updateFiltersToolSchema.parse({
      filters: { roomId: "ROOM_COOLING" },
    });
    const command = { action: "update_filters" as const, ...input };
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
