import { Worker } from "node:worker_threads";
import { constants, DatabaseSync } from "node:sqlite";
import type {
  DatasetColumn,
  DatasetRow,
  HistorianDataset,
  HistorianExecutionRequest,
  HistorianExecutionResult,
  HistorianValidationResult,
} from "@packt-workshop/contracts";
import {
  DATASET_ROW_LIMIT,
  datasetCellSchema,
} from "@packt-workshop/contracts";

export const HISTORIAN_POLICY_VERSION = "historian-v2";
export const HISTORIAN_ROW_LIMIT = DATASET_ROW_LIMIT;
export const HISTORIAN_TIMEOUT_MS = 750;

const HISTORIAN_VIEW = "historian_readings";
const HISTORIAN_COLUMNS = new Set([
  "reading_id",
  "recorded_at",
  "room_id",
  "room_name",
  "room_area_type",
  "room_description",
  "metric_id",
  "metric_name",
  "unit",
  "numeric_value",
  "text_value",
  "shift_manager_name",
  "condition",
]);
const VIEW_SOURCE_TABLES = new Set([
  "metric_readings",
  "metrics",
  "rooms",
  "shift_managers",
]);
const ALLOWED_FUNCTIONS = new Set([
  "abs",
  "avg",
  "count",
  "sum",
  "total",
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
const FORBIDDEN_KEYWORDS = new Set([
  "ALTER",
  "ANALYZE",
  "ATTACH",
  "BEGIN",
  "COMMIT",
  "CREATE",
  "DELETE",
  "DETACH",
  "DROP",
  "EXPLAIN",
  "INSERT",
  "PRAGMA",
  "RECURSIVE",
  "REINDEX",
  "RELEASE",
  "REPLACE",
  "ROLLBACK",
  "SAVEPOINT",
  "TRANSACTION",
  "UPDATE",
  "VACUUM",
]);

export class HistorianPolicyError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type SqlScan = {
  tokens: string[];
  semicolons: number[];
};

function scanSql(sql: string): SqlScan {
  const tokens: string[] = [];
  const semicolons: number[] = [];
  let index = 0;

  const skipQuoted = (quote: string, closingQuote = quote): void => {
    index += 1;
    while (index < sql.length) {
      if (sql[index] === closingQuote) {
        if (sql[index + 1] === closingQuote && closingQuote !== "]") {
          index += 2;
          continue;
        }
        index += 1;
        return;
      }
      index += 1;
    }
    throw new HistorianPolicyError(
      "UNTERMINATED_LITERAL",
      "The SQL contains an unterminated string or quoted identifier.",
    );
  };

  while (index < sql.length) {
    const character = sql[index]!;
    const next = sql[index + 1];
    if (/\s/.test(character)) {
      index += 1;
      continue;
    }
    if (character === "-" && next === "-") {
      index += 2;
      while (index < sql.length && sql[index] !== "\n") index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      const end = sql.indexOf("*/", index + 2);
      if (end === -1) {
        throw new HistorianPolicyError(
          "UNTERMINATED_COMMENT",
          "The SQL contains an unterminated block comment.",
        );
      }
      index = end + 2;
      continue;
    }
    if (character === "'" || character === '"' || character === "`") {
      skipQuoted(character);
      continue;
    }
    if (character === "[") {
      skipQuoted("[", "]");
      continue;
    }
    if (character === ";") {
      semicolons.push(index);
      index += 1;
      continue;
    }
    if (/[A-Za-z_]/.test(character)) {
      const start = index;
      index += 1;
      while (index < sql.length && /[A-Za-z0-9_$]/.test(sql[index]!)) {
        index += 1;
      }
      tokens.push(sql.slice(start, index).toUpperCase());
      continue;
    }
    index += 1;
  }
  return { tokens, semicolons };
}

export function validateHistorianStatement(sql: string): string {
  const normalized = sql.trim();
  if (!normalized) {
    throw new HistorianPolicyError("EMPTY_SQL", "The SQL statement is empty.");
  }
  if (normalized.length > 12_000) {
    throw new HistorianPolicyError(
      "SQL_TOO_LONG",
      "The SQL statement exceeds the 12,000-character limit.",
    );
  }

  const { tokens, semicolons } = scanSql(normalized);
  const firstToken = tokens[0];
  if (firstToken !== "SELECT" && firstToken !== "WITH") {
    throw new HistorianPolicyError(
      "READ_ONLY_STATEMENT_REQUIRED",
      "Only one SELECT or WITH ... SELECT statement is permitted.",
    );
  }
  const forbidden = tokens.find((token) => FORBIDDEN_KEYWORDS.has(token));
  if (forbidden) {
    throw new HistorianPolicyError(
      "FORBIDDEN_OPERATION",
      `The SQL operation ${forbidden} is not permitted.`,
    );
  }
  if (semicolons.length > 1) {
    throw new HistorianPolicyError(
      "MULTIPLE_STATEMENTS",
      "Exactly one SQL statement is permitted.",
    );
  }
  if (semicolons.length === 1) {
    const semicolon = semicolons[0]!;
    if (normalized.slice(semicolon + 1).trim()) {
      throw new HistorianPolicyError(
        "MULTIPLE_STATEMENTS",
        "Exactly one SQL statement is permitted.",
      );
    }
    return normalized.slice(0, semicolon).trim();
  }
  return normalized;
}

type ExecutedHistorianQuery = {
  columns: DatasetColumn[];
  rows: DatasetRow[];
  durationMs: number;
};

export function executeHistorianSql(
  databasePath: string,
  untrustedSql: string,
  validateOnly = false,
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
            argument2 !== null &&
            (HISTORIAN_COLUMNS.has(argument2) || argument2 === "")
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
      columnNames.length > 24 ||
      columnNames.some((name) => !/^[a-z][a-z0-9_]{0,63}$/.test(name)) ||
      new Set(columnNames).size !== columnNames.length
    ) {
      throw new HistorianPolicyError(
        "UNSUPPORTED_RESULT_SHAPE",
        "Return up to 24 uniquely named scalar columns using snake_case aliases.",
      );
    }
    // Preparing the statement applies the same SQL/SQLite rules without running it.
    if (validateOnly)
      return {
        columns: [],
        rows: [],
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
      };
    const objects = statement.all();
    if (objects.length > HISTORIAN_ROW_LIMIT) {
      throw new HistorianPolicyError(
        "DATASET_TOO_LARGE",
        `The query exceeds ${HISTORIAN_ROW_LIMIT} rows. Narrow the date range or filters; partial datasets cannot supply accurate group summaries.`,
      );
    }
    const rows: DatasetRow[] = objects.map((object) =>
      Object.fromEntries(
        Object.entries(object).map(([key, value]) => {
          const parsed = datasetCellSchema.safeParse(value);
          if (!parsed.success)
            throw new HistorianPolicyError(
              "INVALID_RESULT_VALUE",
              "Only finite numbers, text up to 2,000 characters, and null are permitted.",
            );
          return [key, parsed.data];
        }),
      ),
    );
    if (Buffer.byteLength(JSON.stringify(rows)) > 16 * 1024 * 1024) {
      throw new HistorianPolicyError(
        "RESULT_TOO_LARGE",
        "The historian dataset exceeds the 16 MB limit. Narrow the request.",
      );
    }
    const columns: DatasetColumn[] = columnNames.map((key) => {
      const values = rows
        .map((row) => row[key])
        .filter((value) => value !== null);
      return {
        key,
        label: key
          .split("_")
          .map((word) => word[0]!.toUpperCase() + word.slice(1))
          .join(" "),
        type:
          key === "recorded_at"
            ? "datetime"
            : ["reading_id", "numeric_value"].includes(key) ||
                (values.length &&
                  values.every((value) => typeof value === "number"))
              ? "number"
              : "text",
      };
    });
    return {
      columns,
      rows,
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

type HistorianWorkerResult =
  | { ok: true; result: ExecutedHistorianQuery }
  | { ok: false; code: string; message: string };

export function executeHistorianSqlInWorker(
  databasePath: string,
  sql: string,
  timeoutMs = HISTORIAN_TIMEOUT_MS,
  validateOnly = false,
): Promise<ExecutedHistorianQuery> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./historian-query-worker.js", import.meta.url),
      {
        workerData: { databasePath, sql, validateOnly },
        execArgv: ["--enable-source-maps"],
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
  validate(sql: string): Promise<HistorianValidationResult>;
  execute(
    request: HistorianExecutionRequest,
  ): Promise<HistorianExecutionResult>;
};

export class HistorianQueryService implements HistorianQueryExecutor {
  constructor(
    private readonly databasePath: string,
    private readonly runQuery = executeHistorianSqlInWorker,
  ) {}

  async validate(sql: string): Promise<HistorianValidationResult> {
    try {
      await executeHistorianSqlInWorker(
        this.databasePath,
        sql,
        HISTORIAN_TIMEOUT_MS,
        true,
      );
      return { approved: true, policyVersion: HISTORIAN_POLICY_VERSION };
    } catch (error) {
      return {
        approved: false,
        policyVersion: HISTORIAN_POLICY_VERSION,
        code:
          error instanceof HistorianPolicyError
            ? error.code
            : "VALIDATION_FAILED",
        message:
          error instanceof Error ? error.message : "The SQL check failed.",
      };
    }
  }

  async execute(
    request: HistorianExecutionRequest,
  ): Promise<HistorianExecutionResult> {
    try {
      if (!request.review.approved)
        throw new HistorianPolicyError(
          "REVIEW_REQUIRED",
          "The SQL reviewer must approve the query before execution.",
        );
      const result = await this.runQuery(this.databasePath, request.sql);
      const { columns, rows, durationMs } = result;
      const metadata = {
        columns,
        rowCount: rows.length,
        createdAt: new Date().toISOString(),
      };
      const data: HistorianDataset = {
        ...metadata,
        question: request.question,
        sql: request.sql,
        rows,
      };
      return {
        status: "executed",
        ...request,
        policyVersion: HISTORIAN_POLICY_VERSION,
        dataset: metadata,
        data,
        entries: [],
        rowCount: rows.length,
        truncated: false,
        durationMs,
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
