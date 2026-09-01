import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { sqlReviewSchema, type SqlReview } from "@packt-workshop/contracts";

// Workflow-private, tool-free agent for the review-sql step.

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

The exact catalog values are:
- room_name: Cooling room, Packaging hall
- metric_name: Air temperature, Relative humidity, Product surface temperature, Supply-air temperature, Cooling-unit power, Line state, Line speed, Seal temperature, Package reject rate

Reject an equality predicate that shortens or invents one of these catalog values. In an unqualified facility request, "temperature" means the Air temperature metric. For example, metric_name = 'Temperature' is wrong; metric_name = 'Air temperature' is correct.

Useful SQLite features include CTEs, aggregates, window functions such as LAG, and date/time functions. For warning intervals, a warning begins when condition changes into warning and ends at the first later non-warning reading. If there is no later non-warning reading, report it as still active.

Approve only when the SQL and explanation answer the supplied question. Return concise concerns when rejecting. Never claim that approval makes SQL safe; a deterministic policy runs after you.

Respond with only compact JSON in this shape:
{"approved":true|false,"summary":"short verdict","concerns":["concern"]}`;

export type SqlReviewRequest = {
  question: string;
  sql: string;
  explanation: string;
};
export type SqlReviewFunction = (
  request: SqlReviewRequest,
) => Promise<SqlReview>;

export const createSqlReviewerAgent = (apiKey: string, model: string) => {
  const openrouter = createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  return new Agent({
    id: "sql-reviewer",
    name: "Historian SQL Reviewer",
    description:
      "Reviews generated historian SQL for semantic correctness before deterministic validation.",
    instructions: SQL_REVIEWER_INSTRUCTIONS,
    model: openrouter(model),
  });
};

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
        structuredOutput: {
          schema: sqlReviewSchema,
          jsonPromptInjection: "auto",
        },
      },
    );
    return sqlReviewSchema.parse(result.object);
  };
}
