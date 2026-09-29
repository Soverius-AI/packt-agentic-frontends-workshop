// Shared lexical preflight. Database authorization and read-only execution remain mandatory.
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
