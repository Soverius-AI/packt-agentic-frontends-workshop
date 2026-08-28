import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  executeHistorianSql,
  HistorianPolicyError,
  HistorianQueryService,
  validateHistorianStatement,
} from "./historian-query.js";
import { FacilityRepository } from "./repository.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createHistorian(): {
  databasePath: string;
  repository: FacilityRepository;
} {
  const directory = mkdtempSync(join(tmpdir(), "packt-historian-"));
  temporaryDirectories.push(directory);
  const databasePath = join(directory, "facility.sqlite");
  const repository = new FacilityRepository(databasePath);
  repository.initialize();
  return { databasePath, repository };
}

describe("deterministic historian query boundary", () => {
  it("allows useful aggregation only through the historian view", () => {
    const { databasePath, repository } = createHistorian();
    const result = executeHistorianSql(
      databasePath,
      `SELECT shift_manager_name, ROUND(MAX(numeric_value), 2) AS maximum_temperature
       FROM historian_readings
       WHERE metric_id = 'cooling-air-temperature'
         AND shift_manager_name IN ('Charles Bond', 'Denise Weber')
       GROUP BY shift_manager_name
       ORDER BY CASE shift_manager_name WHEN 'Charles Bond' THEN 1 ELSE 2 END`,
    );

    expect(result.columns).toEqual([
      "shift_manager_name",
      "maximum_temperature",
    ]);
    expect(result.rows.map((row) => row[0])).toEqual([
      "Charles Bond",
      "Denise Weber",
    ]);
    expect(result.truncated).toBe(false);
    repository.close();
  });

  it("supports transition queries with CTEs and window functions", () => {
    const { databasePath, repository } = createHistorian();
    const result = executeHistorianSql(
      databasePath,
      `WITH ordered AS (
         SELECT recorded_at, condition,
                LAG(condition) OVER (ORDER BY recorded_at) AS previous_condition
         FROM historian_readings
         WHERE metric_id = 'cooling-air-temperature'
       )
       SELECT recorded_at AS warning_started
       FROM ordered
       WHERE condition = 'warning'
         AND COALESCE(previous_condition, 'normal') <> 'warning'
       ORDER BY recorded_at`,
    );

    expect(result.columns).toEqual(["warning_started"]);
    expect(result.rowCount).toBeGreaterThanOrEqual(7);
    repository.close();
  });

  it.each([
    ["DELETE FROM historian_readings", "READ_ONLY_STATEMENT_REQUIRED"],
    ["SELECT * FROM historian_readings; SELECT 1", "MULTIPLE_STATEMENTS"],
    [
      "WITH RECURSIVE loop(x) AS (SELECT 1) SELECT * FROM loop",
      "FORBIDDEN_OPERATION",
    ],
  ])("rejects %s", (sql, code) => {
    expect(() => validateHistorianStatement(sql)).toThrowError(
      expect.objectContaining<Partial<HistorianPolicyError>>({ code }),
    );
  });

  it("uses SQLite authorization to deny direct tables and unknown functions", () => {
    const { databasePath, repository } = createHistorian();

    expect(() =>
      executeHistorianSql(databasePath, "SELECT * FROM metric_readings"),
    ).toThrow(/not authorized|access.*prohibited/i);
    expect(() =>
      executeHistorianSql(
        databasePath,
        "SELECT randomblob(1000) FROM historian_readings",
      ),
    ).toThrow(/not authorized|prohibited/i);
    repository.close();
  });

  it("reports deterministic rejections without executing them", async () => {
    const { databasePath, repository } = createHistorian();
    const service = new HistorianQueryService(databasePath, async (path, sql) =>
      executeHistorianSql(path, sql),
    );
    const result = await service.execute({
      question: "Delete the history.",
      sql: "DELETE FROM historian_readings",
      explanation: "Delete readings.",
      review: { approved: true, summary: "Test verdict.", concerns: [] },
    });

    expect(result).toMatchObject({
      status: "rejected",
      stage: "validator",
      code: "READ_ONLY_STATEMENT_REQUIRED",
    });
    repository.close();
  });
});
