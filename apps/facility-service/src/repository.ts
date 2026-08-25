import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  alarmStateSchema,
  facilityDashboardSchema,
  facilityReadingPageSchema,
  metricAlarmSchema,
  metricHistorySchema,
  metricUpdateEventSchema,
  type AlarmState,
  type FacilityDashboard,
  type FacilityReadingPage,
  type MetricAlarm,
  type MetricHistory,
  type MetricSummary,
  type MetricUpdateEvent,
} from "@packt-workshop/contracts";
import {
  coolingAirTemperatureAt,
  generateLiveReading,
  isCoolingAirTemperatureWarning,
  METRICS,
  ROOMS,
} from "./seed-data.js";

interface RoomRow {
  id: string;
  name: string;
  area_type: string;
  description: string;
}

interface MetricRow {
  id: string;
  room_id: string;
  equipment_name: string | null;
  name: string;
  kind: "numeric" | "state";
  unit: string;
  condition: "normal" | "warning" | "critical" | "unavailable";
  trend: string;
  target: string;
  detail: string;
  numeric_value: number | null;
  text_value: string | null;
  recorded_at: string;
  shift_manager_name: string;
  alarm_id: string | null;
  alarm_state: AlarmState | null;
  alarm_raised_at: string | null;
  alarm_updated_at: string | null;
  alarm_operator_id: string | null;
}

interface ReadingRow {
  recorded_at: string;
  numeric_value: number | null;
  text_value: string | null;
  shift_manager_name: string;
}

interface FacilityReadingEntryRow {
  id: number;
  recorded_at: string;
  room_id: string;
  room_name: string;
  metric_id: string;
  metric_name: string;
  unit: string;
  numeric_value: number | null;
  text_value: string | null;
  shift_manager_name: string;
  reading_condition: "normal" | "warning" | "critical" | "unavailable";
}

export interface ReadingEntryFilters {
  from?: string;
  to?: string;
  shiftManager?: string;
  roomId?: string;
  metricId?: string;
  condition?: "normal" | "warning" | "critical" | "unavailable";
  limit?: number;
  offset?: number;
}

interface CurrentReadingRow {
  numeric_value: number | null;
  text_value: string | null;
}

interface AlarmRow {
  id: string;
  metric_id: string;
  state: AlarmState;
  raised_at: string;
  updated_at: string;
  operator_id: string;
}

const SHIFT_MANAGERS = [
  { id: "charles-bond", name: "Charles Bond" },
  { id: "denise-weber", name: "Denise Weber" },
  { id: "martin-thompson", name: "Martin Thompson" },
] as const;

const factoryHourFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Vienna",
});

function shiftManagerIdAt(recordedAt: string): string {
  const hour = Number(factoryHourFormatter.format(new Date(recordedAt)));
  if (hour >= 6 && hour < 14) return "charles-bond";
  if (hour >= 14 && hour < 22) return "denise-weber";
  return "martin-thompson";
}

export class FacilityRepositoryError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

export class FacilityRepository {
  readonly #database: DatabaseSync;

  constructor(databasePath: string) {
    if (databasePath !== ":memory:") {
      mkdirSync(dirname(databasePath), { recursive: true });
    }
    this.#database = new DatabaseSync(databasePath);
  }

  initialize(): void {
    this.#database.exec("PRAGMA journal_mode = WAL;");
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        area_type TEXT NOT NULL,
        description TEXT NOT NULL,
        sort_order INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS metrics (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL REFERENCES rooms(id),
        equipment_name TEXT,
        name TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('numeric', 'state')),
        unit TEXT NOT NULL,
        condition TEXT NOT NULL CHECK (condition IN ('normal', 'warning', 'critical', 'unavailable')),
        trend TEXT NOT NULL,
        target TEXT NOT NULL,
        detail TEXT NOT NULL,
        sort_order INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS shift_managers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS metric_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_id TEXT NOT NULL REFERENCES metrics(id),
        recorded_at TEXT NOT NULL,
        numeric_value REAL,
        text_value TEXT,
        shift_manager_id TEXT REFERENCES shift_managers(id),
        CHECK (numeric_value IS NOT NULL OR text_value IS NOT NULL)
      );

      CREATE INDEX IF NOT EXISTS metric_readings_metric_time
        ON metric_readings(metric_id, recorded_at);

      CREATE TABLE IF NOT EXISTS metric_alarms (
        id TEXT PRIMARY KEY,
        metric_id TEXT NOT NULL REFERENCES metrics(id),
        state TEXT NOT NULL CHECK (state IN ('raised', 'acknowledged', 'resolved')),
        raised_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        operator_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS metric_alarms_metric_state
        ON metric_alarms(metric_id, state);
    `);

    this.#migrateShiftManagers();

    this.#removeRetiredMetric("cooling-door-state");
    this.#synchronizeSimulationConditions();

    const metricCount = this.#database
      .prepare("SELECT COUNT(*) AS count FROM metrics")
      .get() as { count: number };
    if (metricCount.count === 0) {
      this.#seedMetadata();
    }
    this.#synchronizeMetricTargets();
    this.#ensureHistoryCoverage();
    this.#normalizeCurrentReadings();
  }

  getDashboard(): FacilityDashboard {
    const rooms = this.#database
      .prepare(
        "SELECT id, name, area_type, description FROM rooms ORDER BY sort_order",
      )
      .all() as unknown as RoomRow[];
    const metrics = this.#database
      .prepare(
        `SELECT
          m.id,
          m.room_id,
          m.equipment_name,
          m.name,
          m.kind,
          m.unit,
          m.condition,
          m.trend,
          m.target,
          m.detail,
          reading.numeric_value,
          reading.text_value,
          reading.recorded_at,
          shift_manager.name AS shift_manager_name,
          alarm.id AS alarm_id,
          alarm.state AS alarm_state,
          alarm.raised_at AS alarm_raised_at,
          alarm.updated_at AS alarm_updated_at,
          alarm.operator_id AS alarm_operator_id
        FROM metrics m
        JOIN rooms r ON r.id = m.room_id
        JOIN metric_readings reading ON reading.id = (
          SELECT latest.id
          FROM metric_readings latest
          WHERE latest.metric_id = m.id
          ORDER BY latest.recorded_at DESC, latest.id DESC
          LIMIT 1
        )
        JOIN shift_managers shift_manager ON shift_manager.id = reading.shift_manager_id
        LEFT JOIN metric_alarms alarm ON alarm.id = (
          SELECT active.id
          FROM metric_alarms active
          WHERE active.metric_id = m.id AND active.state != 'resolved'
          ORDER BY active.raised_at DESC
          LIMIT 1
        )
        ORDER BY r.sort_order, m.sort_order`,
      )
      .all() as unknown as MetricRow[];

    const activeAlarmCount = metrics.filter(
      (metric) => metric.alarm_id !== null,
    ).length;
    return facilityDashboardSchema.parse({
      siteName: "Soverius Chocolate Bar",
      generatedAt: new Date().toISOString(),
      activeAlarmCount,
      shiftManagers: SHIFT_MANAGERS.map((manager) => manager.name),
      rooms: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        areaType: room.area_type,
        description: room.description,
        metrics: metrics
          .filter((metric) => metric.room_id === room.id)
          .map((metric) => this.#toMetricSummary(metric)),
      })),
    });
  }

  getHistory(metricId: string, hours: number): MetricHistory {
    const metric = this.#findMetric(metricId);
    if (!metric) {
      throw new FacilityRepositoryError(`Unknown metric: ${metricId}`, 404);
    }
    const safeHours = Math.max(1, Math.min(168, Math.trunc(hours)));
    const from = new Date(
      Date.now() - safeHours * 60 * 60 * 1000,
    ).toISOString();
    const readings = this.#database
      .prepare(
        `SELECT reading.recorded_at, reading.numeric_value, reading.text_value,
                shift_manager.name AS shift_manager_name
         FROM metric_readings reading
         JOIN shift_managers shift_manager ON shift_manager.id = reading.shift_manager_id
         WHERE reading.metric_id = ? AND reading.recorded_at >= ?
         ORDER BY recorded_at`,
      )
      .all(metricId, from) as unknown as ReadingRow[];

    const { activeAlarm: _activeAlarm, ...metricWithoutAlarm } = metric;
    return metricHistorySchema.parse({
      metric: metricWithoutAlarm,
      readings: readings.map((reading) => ({
        recordedAt: reading.recorded_at,
        numericValue: reading.numeric_value,
        textValue: reading.text_value,
        shiftManagerName: reading.shift_manager_name,
      })),
    });
  }

  getReadingEntries(filters: ReadingEntryFilters = {}): FacilityReadingPage {
    const from = this.#parseFilterDate(
      filters.from ??
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      "from",
    );
    const to = this.#parseFilterDate(
      filters.to ?? new Date().toISOString(),
      "to",
    );
    if (from > to) {
      throw new FacilityRepositoryError(
        "The reading range starts after it ends.",
        400,
      );
    }
    const requestedLimit = filters.limit ?? 200;
    if (!Number.isFinite(requestedLimit)) {
      throw new FacilityRepositoryError("Invalid reading limit.", 400);
    }
    const limit = Math.max(1, Math.min(500, Math.trunc(requestedLimit)));
    const requestedOffset = filters.offset ?? 0;
    if (!Number.isFinite(requestedOffset) || requestedOffset < 0) {
      throw new FacilityRepositoryError("Invalid reading offset.", 400);
    }
    const offset = Math.trunc(requestedOffset);
    const conditionExpression = `CASE
      WHEN metric.id = 'cooling-air-temperature' AND reading.numeric_value > 18 THEN 'warning'
      WHEN metric.id = 'cooling-relative-humidity' AND reading.numeric_value > 55 THEN 'warning'
      ELSE 'normal'
    END`;
    const where = ["reading.recorded_at >= ?", "reading.recorded_at <= ?"];
    const parameters: (string | number)[] = [
      new Date(from).toISOString(),
      new Date(to).toISOString(),
    ];
    const addFilter = (column: string, value: string | undefined): void => {
      if (!value) return;
      where.push(`${column} = ?`);
      parameters.push(value);
    };
    addFilter("shift_manager.name", filters.shiftManager);
    addFilter("room.id", filters.roomId);
    addFilter("metric.id", filters.metricId);
    if (filters.condition) {
      where.push(`${conditionExpression} = ?`);
      parameters.push(filters.condition);
    }
    const fromAndWhere = `
      FROM metric_readings reading
      JOIN metrics metric ON metric.id = reading.metric_id
      JOIN rooms room ON room.id = metric.room_id
      JOIN shift_managers shift_manager ON shift_manager.id = reading.shift_manager_id
      WHERE ${where.join(" AND ")}`;
    const total = (
      this.#database
        .prepare(`SELECT COUNT(*) AS count ${fromAndWhere}`)
        .get(...parameters) as {
        count: number;
      }
    ).count;
    const rows = this.#database
      .prepare(
        `SELECT reading.id,
                reading.recorded_at,
                room.id AS room_id,
                room.name AS room_name,
                metric.id AS metric_id,
                metric.name AS metric_name,
                metric.unit,
                reading.numeric_value,
                reading.text_value,
                shift_manager.name AS shift_manager_name,
                ${conditionExpression} AS reading_condition
         ${fromAndWhere}
         ORDER BY reading.recorded_at DESC, reading.id DESC
         LIMIT ? OFFSET ?`,
      )
      .all(
        ...parameters,
        limit,
        offset,
      ) as unknown as FacilityReadingEntryRow[];

    return facilityReadingPageSchema.parse({
      total,
      limit,
      offset,
      entries: rows.map((row) => ({
        id: row.id,
        recordedAt: row.recorded_at,
        roomId: row.room_id,
        roomName: row.room_name,
        metricId: row.metric_id,
        metricName: row.metric_name,
        unit: row.unit,
        numericValue: row.numeric_value,
        textValue: row.text_value,
        shiftManagerName: row.shift_manager_name,
        condition: row.reading_condition,
      })),
    });
  }

  recordRandomReading(random: () => number = Math.random): MetricUpdateEvent {
    const metric = METRICS[Math.floor(random() * METRICS.length)];
    if (!metric) {
      throw new Error("The facility has no configured metrics.");
    }
    const current = this.#database
      .prepare(
        `SELECT numeric_value, text_value
         FROM metric_readings
         WHERE metric_id = ?
         ORDER BY recorded_at DESC, id DESC
         LIMIT 1`,
      )
      .get(metric.id) as unknown as CurrentReadingRow | undefined;
    const recordedAt = new Date().toISOString();
    const reading = generateLiveReading(
      metric.id,
      current?.numeric_value ?? null,
      current?.text_value ?? null,
      random,
      metric.id === "cooling-air-temperature"
        ? isCoolingAirTemperatureWarning(recordedAt)
        : true,
    );

    this.#database.exec("BEGIN");
    try {
      this.#database
        .prepare(
          `INSERT INTO metric_readings
            (metric_id, recorded_at, numeric_value, text_value, shift_manager_id)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(
          metric.id,
          recordedAt,
          reading.numericValue,
          reading.textValue,
          shiftManagerIdAt(recordedAt),
        );
      this.#database
        .prepare("UPDATE metrics SET condition = ?, trend = ? WHERE id = ?")
        .run(reading.condition, reading.trend, metric.id);
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }

    const updatedMetric = this.#findMetric(metric.id);
    if (!updatedMetric) {
      throw new Error(`Updated metric disappeared: ${metric.id}`);
    }
    return metricUpdateEventSchema.parse({
      type: "metric.updated",
      metric: updatedMetric,
    });
  }

  raiseAlarm(metricId: string, operatorId: string): MetricAlarm {
    if (!this.#findMetric(metricId)) {
      throw new FacilityRepositoryError(`Unknown metric: ${metricId}`, 404);
    }
    const existing = this.#getActiveAlarm(metricId);
    if (existing) {
      throw new FacilityRepositoryError(
        "This metric already has an active alarm.",
        409,
      );
    }

    const now = new Date().toISOString();
    const id = `ALARM-${randomUUID()}`;
    this.#database
      .prepare(
        `INSERT INTO metric_alarms
          (id, metric_id, state, raised_at, updated_at, operator_id)
         VALUES (?, ?, 'raised', ?, ?, ?)`,
      )
      .run(id, metricId, now, now, operatorId);
    return this.#getAlarm(id);
  }

  transitionAlarm(
    alarmId: string,
    state: AlarmState,
    operatorId: string,
  ): MetricAlarm {
    const current = this.#getAlarm(alarmId);
    const nextState = alarmStateSchema.parse(state);
    const allowed =
      (current.state === "raised" && nextState === "acknowledged") ||
      (current.state === "acknowledged" && nextState === "resolved");
    if (!allowed) {
      throw new FacilityRepositoryError(
        `Cannot change an alarm from ${current.state} to ${nextState}.`,
        409,
      );
    }

    this.#database
      .prepare(
        "UPDATE metric_alarms SET state = ?, updated_at = ?, operator_id = ? WHERE id = ?",
      )
      .run(nextState, new Date().toISOString(), operatorId, alarmId);
    return this.#getAlarm(alarmId);
  }

  close(): void {
    this.#database.close();
  }

  #seedMetadata(): void {
    const insertRoom = this.#database.prepare(
      "INSERT INTO rooms (id, name, area_type, description, sort_order) VALUES (?, ?, ?, ?, ?)",
    );
    const insertMetric = this.#database.prepare(
      `INSERT INTO metrics
        (id, room_id, equipment_name, name, kind, unit, condition, trend, target, detail, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    this.#database.exec("BEGIN");
    try {
      for (const room of ROOMS) {
        insertRoom.run(
          room.id,
          room.name,
          room.areaType,
          room.description,
          room.sortOrder,
        );
      }
      for (const metric of METRICS) {
        insertMetric.run(
          metric.id,
          metric.roomId,
          metric.equipmentName,
          metric.name,
          metric.kind,
          metric.unit,
          metric.condition,
          metric.trend,
          metric.target,
          metric.detail,
          metric.sortOrder,
        );
      }
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  #migrateShiftManagers(): void {
    const columns = this.#database
      .prepare("PRAGMA table_info(metric_readings)")
      .all() as unknown as { name: string }[];
    if (!columns.some((column) => column.name === "shift_manager_id")) {
      this.#database.exec(
        "ALTER TABLE metric_readings ADD COLUMN shift_manager_id TEXT REFERENCES shift_managers(id)",
      );
    }

    const upsertManager = this.#database.prepare(
      `INSERT INTO shift_managers (id, name) VALUES (?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name`,
    );
    for (const manager of SHIFT_MANAGERS) {
      upsertManager.run(manager.id, manager.name);
    }

    const readings = this.#database
      .prepare(
        "SELECT id, recorded_at FROM metric_readings WHERE shift_manager_id IS NULL",
      )
      .all() as unknown as { id: number; recorded_at: string }[];
    const assignManager = this.#database.prepare(
      "UPDATE metric_readings SET shift_manager_id = ? WHERE id = ?",
    );
    for (const reading of readings) {
      assignManager.run(shiftManagerIdAt(reading.recorded_at), reading.id);
    }
  }

  #removeRetiredMetric(metricId: string): void {
    this.#database.exec("BEGIN");
    try {
      this.#database
        .prepare("DELETE FROM metric_alarms WHERE metric_id = ?")
        .run(metricId);
      this.#database
        .prepare("DELETE FROM metric_readings WHERE metric_id = ?")
        .run(metricId);
      this.#database.prepare("DELETE FROM metrics WHERE id = ?").run(metricId);
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  #synchronizeSimulationConditions(): void {
    const updateMetric = this.#database.prepare(
      "UPDATE metrics SET condition = ?, trend = ? WHERE id = ?",
    );
    for (const metric of METRICS) {
      updateMetric.run(metric.condition, metric.trend, metric.id);
    }
  }

  #synchronizeMetricTargets(): void {
    const updateMetric = this.#database.prepare(
      "UPDATE metrics SET target = ? WHERE id = ?",
    );
    for (const metric of METRICS) {
      updateMetric.run(metric.target, metric.id);
    }
  }

  #normalizeCurrentReadings(): void {
    const findCurrent = this.#database.prepare(
      `SELECT numeric_value, text_value
       FROM metric_readings
       WHERE metric_id = ?
       ORDER BY recorded_at DESC, id DESC
       LIMIT 1`,
    );
    const insertReading = this.#database.prepare(
      `INSERT INTO metric_readings
        (metric_id, recorded_at, numeric_value, text_value, shift_manager_id)
       VALUES (?, ?, ?, ?, ?)`,
    );
    const updateMetric = this.#database.prepare(
      "UPDATE metrics SET condition = ?, trend = ? WHERE id = ?",
    );
    const recordedAt = new Date().toISOString();

    this.#database.exec("BEGIN");
    try {
      for (const metric of METRICS) {
        const current = findCurrent.get(metric.id) as unknown as
          CurrentReadingRow | undefined;
        const reading = generateLiveReading(
          metric.id,
          current?.numeric_value ?? null,
          current?.text_value ?? null,
          Math.random,
          metric.id === "cooling-air-temperature"
            ? isCoolingAirTemperatureWarning(recordedAt)
            : true,
        );
        insertReading.run(
          metric.id,
          recordedAt,
          reading.numericValue,
          reading.textValue,
          shiftManagerIdAt(recordedAt),
        );
        updateMetric.run(reading.condition, reading.trend, metric.id);
      }
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  #ensureHistoryCoverage(): void {
    const insertReading = this.#database.prepare(
      `INSERT INTO metric_readings
        (metric_id, recorded_at, numeric_value, text_value, shift_manager_id)
       VALUES (?, ?, ?, ?, ?)`,
    );
    const intervalMinutes = 5;
    const intervalMilliseconds = intervalMinutes * 60_000;
    const total = (7 * 24 * 60) / intervalMinutes + 1;
    const end =
      Math.floor(Date.now() / intervalMilliseconds) * intervalMilliseconds;
    const start = end - (total - 1) * intervalMilliseconds;
    const existingReadings = this.#database
      .prepare(
        `SELECT metric_id, recorded_at
         FROM metric_readings
         WHERE recorded_at >= ?`,
      )
      .all(new Date(start).toISOString()) as unknown as {
      metric_id: string;
      recorded_at: string;
    }[];
    const occupiedTimestamps = new Map<string, Set<string>>();
    for (const reading of existingReadings) {
      const timestamps =
        occupiedTimestamps.get(reading.metric_id) ?? new Set<string>();
      timestamps.add(reading.recorded_at);
      occupiedTimestamps.set(reading.metric_id, timestamps);
    }

    this.#database.exec("BEGIN");
    try {
      for (const metric of METRICS) {
        const metricTimestamps =
          occupiedTimestamps.get(metric.id) ?? new Set<string>();
        for (let index = 0; index < total; index += 1) {
          const timestamp = start + index * intervalMilliseconds;
          const recordedAt = new Date(timestamp).toISOString();
          if (metricTimestamps.has(recordedAt)) continue;
          const reading =
            metric.id === "cooling-air-temperature"
              ? {
                  numericValue: coolingAirTemperatureAt(recordedAt, index),
                  textValue: null,
                }
              : metric.reading(index, total);
          insertReading.run(
            metric.id,
            recordedAt,
            reading.numericValue,
            reading.textValue,
            shiftManagerIdAt(recordedAt),
          );
          metricTimestamps.add(recordedAt);
        }
      }

      const coolingReadings = this.#database
        .prepare(
          `SELECT id, recorded_at
           FROM metric_readings
           WHERE metric_id = 'cooling-air-temperature' AND recorded_at >= ?`,
        )
        .all(new Date(start).toISOString()) as unknown as {
        id: number;
        recorded_at: string;
      }[];
      const updateCoolingReading = this.#database.prepare(
        "UPDATE metric_readings SET numeric_value = ? WHERE id = ?",
      );
      for (const reading of coolingReadings) {
        const index = Math.floor(
          (Date.parse(reading.recorded_at) - start) / intervalMilliseconds,
        );
        updateCoolingReading.run(
          coolingAirTemperatureAt(reading.recorded_at, index),
          reading.id,
        );
      }
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  #findMetric(metricId: string): MetricSummary | undefined {
    return this.getDashboard()
      .rooms.flatMap((room) => room.metrics)
      .find((metric) => metric.id === metricId);
  }

  #toMetricSummary(metric: MetricRow): MetricSummary {
    const activeAlarm = metric.alarm_id
      ? {
          id: metric.alarm_id,
          metricId: metric.id,
          state: metric.alarm_state,
          raisedAt: metric.alarm_raised_at,
          updatedAt: metric.alarm_updated_at,
          operatorId: metric.alarm_operator_id,
        }
      : null;
    return {
      id: metric.id,
      roomId: metric.room_id,
      equipmentName: metric.equipment_name,
      name: metric.name,
      kind: metric.kind,
      unit: metric.unit,
      currentNumericValue: metric.numeric_value,
      currentTextValue: metric.text_value,
      shiftManagerName: metric.shift_manager_name,
      condition: metric.condition,
      trend: metric.trend,
      target: metric.target,
      detail: metric.detail,
      updatedAt: metric.recorded_at,
      activeAlarm: activeAlarm ? metricAlarmSchema.parse(activeAlarm) : null,
    };
  }

  #parseFilterDate(value: string, name: string): number {
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) {
      throw new FacilityRepositoryError(`Invalid ${name} date.`, 400);
    }
    return timestamp;
  }

  #getActiveAlarm(metricId: string): MetricAlarm | undefined {
    const row = this.#database
      .prepare(
        `SELECT id, metric_id, state, raised_at, updated_at, operator_id
         FROM metric_alarms
         WHERE metric_id = ? AND state != 'resolved'
         ORDER BY raised_at DESC
         LIMIT 1`,
      )
      .get(metricId) as unknown as AlarmRow | undefined;
    return row ? this.#parseAlarm(row) : undefined;
  }

  #getAlarm(alarmId: string): MetricAlarm {
    const row = this.#database
      .prepare(
        `SELECT id, metric_id, state, raised_at, updated_at, operator_id
         FROM metric_alarms
         WHERE id = ?`,
      )
      .get(alarmId) as unknown as AlarmRow | undefined;
    if (!row) {
      throw new FacilityRepositoryError(`Unknown alarm: ${alarmId}`, 404);
    }
    return this.#parseAlarm(row);
  }

  #parseAlarm(row: AlarmRow): MetricAlarm {
    return metricAlarmSchema.parse({
      id: row.id,
      metricId: row.metric_id,
      state: row.state,
      raisedAt: row.raised_at,
      updatedAt: row.updated_at,
      operatorId: row.operator_id,
    });
  }
}
