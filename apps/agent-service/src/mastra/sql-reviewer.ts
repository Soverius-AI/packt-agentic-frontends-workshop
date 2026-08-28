import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import type {
  QueryHistorianToolInput,
  SqlReview,
} from "@packt-workshop/contracts";
import { z } from "zod";
import { DEFAULT_OPENROUTER_MODEL } from "./workshop-agent.js";

export const SQL_REVIEWER_INSTRUCTIONS = `You are the SQL reviewer for the Soverius Chocolate Factory historian.

Review generated SQLite SQL before it reaches the deterministic execution policy. Judge semantic correctness, not security authorization. Confirm that the query answers the operator's question, uses only documented fields, preserves requested ordering or grouping, treats timestamps correctly, and does not invent evidence.

The only query surface is historian_readings with these columns:
- reading_id
- recorded_at (ISO-8601 UTC timestamp)
- room_id, room_name
- metric_id, metric_name, unit
- numeric_value, text_value
- shift_manager_name
- condition (normal, warning, critical, unavailable)

Useful SQLite features include CTEs, aggregates, window functions such as LAG, and date/time functions. For warning intervals, a warning begins when condition changes into warning and ends at the first later non-warning reading. If there is no later non-warning reading, report it as still active.

Approve only when the SQL and explanation answer the supplied question. Return concise concerns when rejecting. Never claim that approval makes SQL safe; a deterministic policy runs after you.

Respond with only compact JSON in this shape:
{"approved":true|false,"summary":"short verdict","concerns":["concern"]}`;

const sqlReviewOutputSchema = z
  .object({
    approved: z.boolean(),
    summary: z.string().trim().min(1).max(1_000),
    concerns: z.array(z.string().trim().min(1).max(500)).max(10),
  })
  .strict();

export type SqlReviewRequest = QueryHistorianToolInput & { question: string };
export type SqlReviewFunction = (
  request: SqlReviewRequest,
) => Promise<SqlReview>;

export type SqlReviewerOptions = {
  apiKey?: string | undefined;
  model?: string | undefined;
};

export const createSqlReviewerAgent = (options: SqlReviewerOptions = {}) => {
  const openrouter = createOpenAI({
    apiKey: options.apiKey ?? "openrouter-not-configured",
    baseURL: "https://openrouter.ai/api/v1",
  });

  return new Agent({
    id: "sql-reviewer",
    name: "Historian SQL Reviewer",
    description:
      "Reviews generated historian SQL for semantic correctness before deterministic validation.",
    instructions: SQL_REVIEWER_INSTRUCTIONS,
    model: openrouter(options.model || DEFAULT_OPENROUTER_MODEL),
  });
};

export function parseSqlReviewText(text: string): SqlReview {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return sqlReviewOutputSchema.parse(JSON.parse(fenced?.[1] ?? trimmed));
}

export function createSqlReviewFunction(
  reviewer: ReturnType<typeof createSqlReviewerAgent>,
): SqlReviewFunction {
  return async ({ question, sql, explanation }) => {
    const result = await reviewer.generate(
      `Operator question:\n${question}\n\nProposed SQL:\n${sql}\n\nGenerator explanation:\n${explanation}`,
      {
        abortSignal: AbortSignal.timeout(30_000),
        maxSteps: 1,
        modelSettings: { temperature: 0, maxOutputTokens: 256 },
      },
    );
    return parseSqlReviewText(result.text);
  };
}
