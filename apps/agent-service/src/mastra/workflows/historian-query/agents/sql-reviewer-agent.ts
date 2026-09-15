import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { sqlReviewSchema, type SqlReview } from "@packt-workshop/contracts";

// Workflow-private, tool-free agent for the review-sql step.

import { SQL_REVIEWER_INSTRUCTIONS } from "../../../prompts/sql-reviewer";

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
