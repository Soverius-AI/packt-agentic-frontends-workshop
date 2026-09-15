import { parentPort, workerData } from "node:worker_threads";
import {
  executeHistorianSql,
  HistorianPolicyError,
} from "./historian-query.js";

const input = workerData as {
  databasePath: string;
  sql: string;
  validateOnly?: boolean;
};

try {
  parentPort?.postMessage({
    ok: true,
    result: executeHistorianSql(
      input.databasePath,
      input.sql,
      input.validateOnly,
    ),
  });
} catch (error) {
  parentPort?.postMessage({
    ok: false,
    code:
      error instanceof HistorianPolicyError
        ? error.code
        : "HISTORIAN_EXECUTION_FAILED",
    message:
      error instanceof Error
        ? error.message
        : "The historian query could not be executed.",
  });
}
