import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { DEFAULT_OPENROUTER_MODEL } from "./workshop-agent";

export const SQL_GENERATOR_INSTRUCTIONS = `You generate one read-only SQLite query for the Soverius Chocolate Factory historian.

The only query surface is historian_readings with these columns:
- reading_id
- recorded_at (ISO-8601 UTC timestamp)
- room_id, room_name
- metric_id, metric_name, unit
- numeric_value, text_value
- shift_manager_name
- condition (normal, warning, critical, unavailable)

Use exactly one SELECT or read-only WITH statement. SQLite CTEs, aggregates, allowlisted window functions such as LAG, and date/time functions are available. For warning intervals, a warning begins when condition changes into warning and ends at the first later non-warning reading. If there is no later non-warning reading, report it as still active. Do not invent tables, columns, or evidence.

Respond with only compact JSON in this shape:
{"sql":"SELECT ...","explanation":"short explanation"}`;

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

export type SqlGeneratorOptions = {
  apiKey?: string | undefined;
  model?: string | undefined;
};

export const createSqlGeneratorAgent = (options: SqlGeneratorOptions = {}) => {
  const openrouter = createOpenAI({
    apiKey: options.apiKey ?? "openrouter-not-configured",
    baseURL: "https://openrouter.ai/api/v1",
  });

  return new Agent({
    id: "sql-generator",
    name: "Historian SQL Generator",
    description:
      "Turns one facility historian question into a structured read-only SQLite query proposal.",
    instructions: SQL_GENERATOR_INSTRUCTIONS,
    model: openrouter(options.model || DEFAULT_OPENROUTER_MODEL),
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
