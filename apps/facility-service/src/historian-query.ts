import {
  HistorianPolicyError,
  validateHistorianStatement,
} from "@packt-workshop/contracts";
export {
  HistorianPolicyError,
  validateHistorianStatement,
} from "@packt-workshop/contracts";
import { Worker } from "node:worker_threads";
import { constants, DatabaseSync } from "node:sqlite";
import type {
  FacilityReadingEntry,
  HistorianExecutionRequest,
  HistorianToolResult,
} from "@packt-workshop/contracts";
import { facilityReadingEntrySchema } from "@packt-workshop/contracts";

export const HISTORIAN_POLICY_VERSION = "historian-v1";
export const HISTORIAN_ROW_LIMIT = 200;
export const HISTORIAN_TIMEOUT_MS = 750;

const HISTORIAN_VIEW = "historian_readings";
const HISTORIAN_COLUMNS = new Set([
  "reading_id",
  "recorded_at",
  "room_id",
  "room_name",
  "metric_id",
  "metric_name",
  "unit",
  "numeric_value",
  "text_value",
  "shift_manager_name",
  "condition",
]);
const HISTORIAN_RESULT_COLUMNS = [
  "reading_id",
  "recorded_at",
  "room_id",
  "room_name",
  "metric_id",
  "metric_name",
  "unit",
  "numeric_value",
  "text_value",
  "shift_manager_name",
  "condition",
] as const;
const VIEW_SOURCE_TABLES = new Set([
  "metric_readings",
  "metrics",
  "rooms",
  "shift_managers",
]);
const ALLOWED_FUNCTIONS = new Set([
  "abs",
  "coalesce",
  "date",
  "datetime",
  "first_value",
  "ifnull",
  "julianday",
  "lag",
  "last_value",
  "lead",
  "lower",
  "max",
  "min",
  "nullif",
  "printf",
  "round",
  "row_number",
  "strftime",
  "substr",
  "time",
  "unixepoch",
  "upper",
]);
type ExecutedHistorianQuery = Pick<
  Extract<HistorianToolResult, { status: "executed" }>,
  "entries" | "rowCount" | "truncated" | "durationMs"
>;

export function executeHistorianSql(
  databasePath: string,
  untrustedSql: string,
): ExecutedHistorianQuery {
  const sql = validateHistorianStatement(untrustedSql);
  const database = new DatabaseSync(databasePath, {
    readOnly: true,
    allowExtension: false,
    enableDoubleQuotedStringLiterals: false,
    timeout: 100,
  });
  const startedAt = performance.now();
  let readHistorianView = false;

  try {
    database.enableLoadExtension(false);
    database.exec("PRAGMA query_only = ON; PRAGMA trusted_schema = OFF;");
    database.setAuthorizer(
      (actionCode, argument1, argument2, _databaseName, triggerOrView) => {
        if (actionCode === constants.SQLITE_SELECT) return constants.SQLITE_OK;
        if (actionCode === constants.SQLITE_FUNCTION) {
          return argument2 && ALLOWED_FUNCTIONS.has(argument2.toLowerCase())
            ? constants.SQLITE_OK
            : constants.SQLITE_DENY;
        }
        if (actionCode === constants.SQLITE_READ) {
          if (
            argument1 === HISTORIAN_VIEW &&
            argument2 &&
            HISTORIAN_COLUMNS.has(argument2)
          ) {
            readHistorianView = true;
            return constants.SQLITE_OK;
          }
          if (
            triggerOrView === HISTORIAN_VIEW &&
            argument1 &&
            VIEW_SOURCE_TABLES.has(argument1)
          ) {
            return constants.SQLITE_OK;
          }
        }
        return constants.SQLITE_DENY;
      },
    );

    const statement = database.prepare(
      `SELECT * FROM (${sql}) AS bounded_historian_result LIMIT ${HISTORIAN_ROW_LIMIT + 1}`,
    );
    if (!readHistorianView) {
      throw new HistorianPolicyError(
        "HISTORIAN_VIEW_REQUIRED",
        `Queries must read from ${HISTORIAN_VIEW}.`,
      );
    }
    const columnNames = statement.columns().map((column) => column.name);
    if (
      columnNames.length !== HISTORIAN_RESULT_COLUMNS.length ||
      columnNames.some(
        (column, index) => column !== HISTORIAN_RESULT_COLUMNS[index],
      )
    ) {
      throw new HistorianPolicyError(
        "UNSUPPORTED_RESULT_SHAPE",
        `Historian queries must return complete reading records with these columns in order: ${HISTORIAN_RESULT_COLUMNS.join(", ")}. Computed result shapes such as averages and counts require a later A2UI milestone.`,
      );
    }
    const objects = statement.all() as Record<
      string,
      null | number | bigint | string | Uint8Array
    >[];
    const truncated = objects.length > HISTORIAN_ROW_LIMIT;
    const entries = objects
      .slice(0, HISTORIAN_ROW_LIMIT)
      .map((row) => parseHistorianReading(row));
    const serializedSize = Buffer.byteLength(JSON.stringify(entries));
    if (serializedSize > 256 * 1024) {
      throw new HistorianPolicyError(
        "RESULT_TOO_LARGE",
        "The historian result exceeds the 256 KB limit.",
      );
    }
    return {
      entries,
      rowCount: entries.length,
      truncated,
      durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
    };
  } catch (error) {
    if (error instanceof HistorianPolicyError) throw error;
    throw new HistorianPolicyError(
      "SQL_POLICY_REJECTED",
      error instanceof Error
        ? error.message
        : "SQLite rejected the historian statement.",
    );
  } finally {
    database.close();
  }
}

function parseHistorianReading(
  row: Record<string, null | number | bigint | string | Uint8Array>,
): FacilityReadingEntry {
  for (const value of Object.values(row)) {
    if (value instanceof Uint8Array) {
      throw new HistorianPolicyError(
        "BINARY_RESULT",
        "Binary historian result values are not permitted.",
      );
    }
  }

  const id = row["reading_id"];
  const numericValue = row["numeric_value"];
  try {
    return facilityReadingEntrySchema.parse({
      id: typeof id === "bigint" ? Number(id) : id,
      recordedAt: row["recorded_at"],
      roomId: row["room_id"],
      roomName: row["room_name"],
      metricId: row["metric_id"],
      metricName: row["metric_name"],
      unit: row["unit"],
      numericValue:
        typeof numericValue === "bigint" ? Number(numericValue) : numericValue,
      textValue: row["text_value"],
      shiftManagerName: row["shift_manager_name"],
      condition: row["condition"],
    });
  } catch {
    throw new HistorianPolicyError(
      "UNSUPPORTED_RESULT_SHAPE",
      "The historian query returned values that do not match the fixed historical-reading grid.",
    );
  }
}

type HistorianWorkerResult =
  | { ok: true; result: ExecutedHistorianQuery }
  | { ok: false; code: string; message: string };

export function executeHistorianSqlInWorker(
  databasePath: string,
  sql: string,
  timeoutMs = HISTORIAN_TIMEOUT_MS,
): Promise<ExecutedHistorianQuery> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./historian-query-worker.js", import.meta.url),
      {
        workerData: { databasePath, sql },
        execArgv: process.execArgv.filter(
          (argument) => !argument.startsWith("--input-type"),
        ),
      },
    );
    const timer = setTimeout(() => {
      void worker.terminate();
      reject(
        new HistorianPolicyError(
          "QUERY_TIMEOUT",
          `The historian query exceeded the ${timeoutMs} ms execution limit.`,
        ),
      );
    }, timeoutMs);
    worker.once("message", (message: HistorianWorkerResult) => {
      clearTimeout(timer);
      void worker.terminate();
      if (message.ok) resolve(message.result);
      else reject(new HistorianPolicyError(message.code, message.message));
    });
    worker.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    worker.once("exit", (code) => {
      if (code !== 0) {
        clearTimeout(timer);
        reject(
          new HistorianPolicyError(
            "WORKER_FAILURE",
            `The historian worker stopped with exit code ${code}.`,
          ),
        );
      }
    });
  });
}

export type HistorianQueryExecutor = {
  execute(request: HistorianExecutionRequest): Promise<HistorianToolResult>;
};

export class HistorianQueryService implements HistorianQueryExecutor {
  constructor(
    private readonly databasePath: string,
    private readonly runQuery = executeHistorianSqlInWorker,
  ) {}

  async execute(
    request: HistorianExecutionRequest,
  ): Promise<HistorianToolResult> {
    try {
      const result = await this.runQuery(this.databasePath, request.sql);
      return {
        status: "executed",
        ...request,
        policyVersion: HISTORIAN_POLICY_VERSION,
        ...result,
      };
    } catch (error) {
      return {
        status: "rejected",
        ...request,
        policyVersion: HISTORIAN_POLICY_VERSION,
        stage:
          error instanceof HistorianPolicyError ? "validator" : "execution",
        code:
          error instanceof HistorianPolicyError
            ? error.code
            : "HISTORIAN_EXECUTION_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "The historian query could not be executed.",
      };
    }
  }
}
