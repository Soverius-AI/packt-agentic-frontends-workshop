import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { LiveTelemetry } from "./live-telemetry.js";
import { FacilityRepository } from "./repository.js";
import {
  generateLiveReading,
  isCoolingAirTemperatureWarning,
} from "./seed-data.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

const createDatabasePath = (): string => {
  const directory = mkdtempSync(join(tmpdir(), "packt-facility-"));
  temporaryDirectories.push(directory);
  return join(directory, "facility.sqlite");
};

const openRepository = (databasePath: string): FacilityRepository => {
  const repository = new FacilityRepository(databasePath);
  repository.initialize();
  return repository;
};

const createRepository = (): FacilityRepository =>
  openRepository(createDatabasePath());

const factoryTime = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Vienna",
});

describe("FacilityRepository", () => {
  it("seeds two rooms with a week of historical metric readings", () => {
    const repository = createRepository();
    const dashboard = repository.getDashboard();
    const history = repository.getHistory("cooling-air-temperature", 168);

    expect(dashboard.siteName).toBe("Soverius Chocolate Bar");
    expect(dashboard.rooms).toHaveLength(2);
    expect(dashboard.rooms.flatMap((room) => room.metrics)).toHaveLength(11);
    expect(
      dashboard.rooms
        .flatMap((room) => room.metrics)
        .find((metric) => metric.id === "cooling-air-temperature")?.condition,
    ).toBe(
      isCoolingAirTemperatureWarning(new Date().toISOString())
        ? "warning"
        : "normal",
    );
    expect(
      dashboard.rooms
        .flatMap((room) => room.metrics)
        .find((metric) => metric.id === "cooling-air-temperature")?.target,
    ).toBe("16–18 °C");
    expect(
      dashboard.rooms
        .flatMap((room) => room.metrics)
        .filter((metric) => !metric.id.startsWith("cooling-air-temperature"))
        .every((metric) =>
          metric.id === "cooling-relative-humidity"
            ? metric.condition === "normal" || metric.condition === "warning"
            : metric.condition === "normal",
        ),
    ).toBe(true);
    expect(history.readings.length).toBeGreaterThan(2_010);
    expect(
      new Set(history.readings.map((reading) => reading.shiftManagerName)),
    ).toEqual(new Set(["Charles Bond", "Denise Weber", "Martin Thompson"]));
    repository.close();
  });

  it("repairs a recent but incomplete database to a full week on restart", () => {
    const databasePath = createDatabasePath();
    const repository = openRepository(databasePath);
    const preservedReading = repository
      .getHistory("cooling-air-temperature", 168)
      .readings.at(-1)?.recordedAt;
    repository.close();

    const database = new DatabaseSync(databasePath);
    database
      .prepare("DELETE FROM metric_readings WHERE recorded_at < ?")
      .run(new Date(Date.now() - 60 * 60 * 1000).toISOString());
    database.close();

    const restartedRepository = openRepository(databasePath);
    const repairedHistory = restartedRepository.getHistory(
      "cooling-air-temperature",
      168,
    );

    expect(repairedHistory.readings.length).toBeGreaterThan(2_010);
    expect(
      Date.parse(repairedHistory.readings[0]!.recordedAt),
    ).toBeLessThanOrEqual(Date.now() - 167 * 60 * 60 * 1000);
    expect(
      repairedHistory.readings.some(
        (reading) => reading.recordedAt === preservedReading,
      ),
    ).toBe(true);
    restartedRepository.close();
  });

  it("assigns all three managers at the exact factory shift handovers", () => {
    const repository = createRepository();
    const readings = repository.getHistory(
      "cooling-air-temperature",
      24,
    ).readings;
    const managerAt = (time: string): string | undefined =>
      readings.find(
        (reading) => factoryTime.format(new Date(reading.recordedAt)) === time,
      )?.shiftManagerName;

    expect(managerAt("05:55")).toBe("Martin Thompson");
    expect(managerAt("06:00")).toBe("Charles Bond");
    expect(managerAt("13:55")).toBe("Charles Bond");
    expect(managerAt("14:00")).toBe("Denise Weber");
    expect(managerAt("21:55")).toBe("Denise Weber");
    expect(managerAt("22:00")).toBe("Martin Thompson");
    repository.close();
  });

  it("uses a two-hour warning on past days and an unresolved warning today", () => {
    const reference = Date.parse("2026-08-25T19:00:00.000Z");

    expect(
      isCoolingAirTemperatureWarning("2026-08-24T09:55:00.000Z", reference),
    ).toBe(false);
    expect(
      isCoolingAirTemperatureWarning("2026-08-24T10:00:00.000Z", reference),
    ).toBe(true);
    expect(
      isCoolingAirTemperatureWarning("2026-08-24T11:55:00.000Z", reference),
    ).toBe(true);
    expect(
      isCoolingAirTemperatureWarning("2026-08-24T12:00:00.000Z", reference),
    ).toBe(false);
    expect(
      isCoolingAirTemperatureWarning("2026-08-25T10:00:00.000Z", reference),
    ).toBe(true);
    expect(
      isCoolingAirTemperatureWarning("2026-08-25T12:00:00.000Z", reference),
    ).toBe(true);
    expect(
      isCoolingAirTemperatureWarning("2026-08-25T19:00:00.000Z", reference),
    ).toBe(true);
  });

  it("filters persisted reading entries with bounded query parameters", () => {
    const repository = createRepository();
    for (const manager of ["Charles Bond", "Denise Weber", "Martin Thompson"]) {
      const page = repository.getReadingEntries({
        shiftManager: manager,
        roomId: "cooling-room",
        metricId: "cooling-air-temperature",
        limit: 500,
      });
      expect(page.total).toBeGreaterThan(0);
      expect(
        page.entries.every((entry) => entry.shiftManagerName === manager),
      ).toBe(true);
      expect(
        page.entries.every(
          (entry) => entry.metricId === "cooling-air-temperature",
        ),
      ).toBe(true);
    }
    const warnings = repository.getReadingEntries({
      roomId: "cooling-room",
      metricId: "cooling-air-temperature",
      condition: "warning",
      limit: 500,
    });
    expect(warnings.total).toBeGreaterThan(0);
    expect(
      warnings.entries.every((entry) => entry.condition === "warning"),
    ).toBe(true);
    expect(
      repository.getReadingEntries({ shiftManager: "Charles Bond' OR 1=1 --" })
        .total,
    ).toBe(0);
    repository.close();
  });

  it("returns stable, non-overlapping pages of persisted readings", () => {
    const repository = createRepository();
    const first = repository.getReadingEntries({ limit: 50, offset: 0 });
    const second = repository.getReadingEntries({ limit: 50, offset: 50 });

    expect(first.limit).toBe(50);
    expect(first.offset).toBe(0);
    expect(first.entries).toHaveLength(50);
    expect(second.offset).toBe(50);
    expect(second.entries).toHaveLength(50);
    expect(second.total).toBe(first.total);
    expect(second.entries[0]?.id).not.toBe(first.entries[0]?.id);
    expect(
      first.entries.some((entry) =>
        second.entries.some((secondEntry) => secondEntry.id === entry.id),
      ),
    ).toBe(false);
    repository.close();
  });

  it("keeps simulated conditions normal except for the two cooling-room exceptions", () => {
    const normalMetrics = [
      ["cooling-product-surface-temperature", 18.4, null],
      ["cooling-supply-air-temperature", 13.8, null],
      ["cooling-unit-power", 3.11, null],
      ["packaging-air-temperature", 22.4, null],
      ["packaging-relative-humidity", 50.2, null],
      ["packaging-line-state", null, "running"],
      ["packaging-line-speed", 59.5, null],
      ["packaging-seal-temperature", 141.6, null],
      ["packaging-reject-rate", 0.75, null],
    ] as const;

    for (const [metricId, numericValue, textValue] of normalMetrics) {
      expect(
        generateLiveReading(metricId, numericValue, textValue, () => 1)
          .condition,
      ).toBe("normal");
      expect(
        generateLiveReading(metricId, numericValue, textValue, () => 0)
          .condition,
      ).toBe("normal");
    }

    expect(
      generateLiveReading("cooling-air-temperature", 21.4, null, () => 1)
        .condition,
    ).toBe("warning");
    const normalHumidity = generateLiveReading(
      "cooling-relative-humidity",
      61.8,
      null,
      () => 0.5,
    );
    const warningHumidity = generateLiveReading(
      "cooling-relative-humidity",
      normalHumidity.numericValue,
      null,
      () => 0.5,
    );
    expect(normalHumidity.condition).toBe("normal");
    expect(warningHumidity.condition).toBe("warning");
  });

  it("persists the raise, acknowledge, and resolve alarm workflow", () => {
    const repository = createRepository();
    const alarm = repository.raiseAlarm(
      "cooling-air-temperature",
      "night-reception",
    );

    expect(repository.getDashboard().activeAlarmCount).toBe(1);
    expect(
      repository.transitionAlarm(alarm.id, "acknowledged", "night-reception")
        .state,
    ).toBe("acknowledged");
    expect(
      repository.transitionAlarm(alarm.id, "resolved", "quality-lead").state,
    ).toBe("resolved");
    expect(repository.getDashboard().activeAlarmCount).toBe(0);
    repository.close();
  });

  it("persists and publishes one randomized metric reading at a time", () => {
    const repository = createRepository();
    const historyBefore = repository.getHistory("cooling-air-temperature", 24);
    const randomValues = [0, 1];
    const telemetry = new LiveTelemetry(repository, {
      random: () => randomValues.shift() ?? 0.5,
    });
    const received: string[] = [];
    telemetry.subscribe((event) => received.push(event.metric.id));

    const event = telemetry.emitNext();
    const historyAfter = repository.getHistory("cooling-air-temperature", 24);

    expect(event.type).toBe("metric.updated");
    expect(event.metric.id).toBe("cooling-air-temperature");
    expect(received).toEqual(["cooling-air-temperature"]);
    expect(historyAfter.readings).toHaveLength(
      historyBefore.readings.length + 1,
    );
    repository.close();
  });
});
