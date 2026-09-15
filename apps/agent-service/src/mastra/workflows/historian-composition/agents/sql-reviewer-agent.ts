import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { sqlReviewSchema, type SqlReview } from "@packt-workshop/contracts";

// Workflow-private, tool-free agent for the review-sql step.

export const SQL_REVIEWER_INSTRUCTIONS = `Review whether the proposed SQLite query and explanation answer the operator's question. Deterministic checks handle security authorization.

Available view: historian_readings
- reading_id, recorded_at (ISO-8601 UTC with T/Z)
- room_id, room_name, room_area_type, room_description
- metric_id, metric_name, unit, numeric_value, text_value
- shift_manager_name, condition (normal, warning, critical, unavailable)
Exact room names: Cooling room, Packaging hall.
Exact metric names: Air temperature, Relative humidity, Product surface temperature, Supply-air temperature, Cooling-unit power, Line state, Line speed, Seal temperature, Package reject rate.
Unqualified "temperature" means Air temperature. Reject invented fields or filter values.

Check filters, ordering, grouping and data sufficiency:
- Configurable reading columns or expandable details require complete underlying rows; the frontend selects columns and calculates summaries.
- Room-description cards need distinct room metadata, not reading values.
- Scalar aggregates are valid when details are unnecessary. Reject aggregates combining different metrics or units, or discarding requested detail.
- Reject LIMIT before grouped/aggregate presentation unless top-N was requested.
- Check date bounds against stored T/Z timestamps; datetime('now') produces a different format.

Return approval, a short summary and concerns using the supplied schema.`;

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
      "Reviews generated historian SQL for semantic correctness before execution.",
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
