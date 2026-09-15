import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { z } from "zod";

// Workflow-private, tool-free agent for the generate-sql step.

import { SQL_GENERATOR_INSTRUCTIONS } from "../../../prompts/sql-generator";

const sqlGenerationSchema = z
  .object({
    sql: z.string().trim().min(1).max(12_000),
    explanation: z.string().trim().min(1).max(1_000),
  })
  .strict();

export type SqlGeneration = z.infer<typeof sqlGenerationSchema>;
export type SqlGenerationFunction = (
  question: string,
) => Promise<SqlGeneration>;

export const createSqlGeneratorAgent = (apiKey: string, model: string) => {
  const openrouter = createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  return new Agent({
    id: "sql-generator",
    name: "Historian SQL Generator",
    description:
      "Turns one facility historian question into a structured read-only SQLite query proposal.",
    instructions: SQL_GENERATOR_INSTRUCTIONS,
    model: openrouter(model),
  });
};

export function createSqlGenerationFunction(
  generator: ReturnType<typeof createSqlGeneratorAgent>,
): SqlGenerationFunction {
  return async (question) => {
    const result = await generator.generate(`Operator question:\n${question}`, {
      abortSignal: AbortSignal.timeout(30_000),
      maxSteps: 1,
      modelSettings: { temperature: 0, maxOutputTokens: 1_500 },
      structuredOutput: {
        schema: sqlGenerationSchema,
        jsonPromptInjection: "auto",
      },
    });
    return sqlGenerationSchema.parse(result.object);
  };
}
