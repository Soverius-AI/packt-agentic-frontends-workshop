import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { z } from "zod";

// Workflow-private, tool-free agent for the generate-sql step.

export const SQL_GENERATOR_INSTRUCTIONS = `You generate one read-only SQLite query for the Soverius Chocolate Factory historian.

The only query surface is historian_readings with these columns:
- reading_id
- recorded_at (ISO-8601 UTC timestamp)
- room_id, room_name
- metric_id, metric_name, unit
- numeric_value, text_value
- shift_manager_name
- condition (normal, warning, critical, unavailable)

Use these exact catalog values when filtering:
- room_name: Cooling room, Packaging hall
- metric_name: Air temperature, Relative humidity, Product surface temperature, Supply-air temperature, Cooling-unit power, Line state, Line speed, Seal temperature, Package reject rate

Never shorten or invent a catalog value in an equality predicate. In an unqualified facility request, "temperature" means the Air temperature metric. Other temperature metrics must be named by the operator or clearly required by the question.

Every successful query must populate the application's existing historical-reading grid. The final SELECT must therefore return complete stored reading records with exactly these columns and in this order:
reading_id, recorded_at, room_id, room_name, metric_id, metric_name, unit, numeric_value, text_value, shift_manager_name, condition.

Use exactly one SELECT or read-only WITH statement. SQLite CTEs, MAX, MIN, allowlisted window functions such as ROW_NUMBER, and date/time functions are available. A request for a maximum or minimum is supported by selecting the complete stored reading row that contains the extreme value. Prefer ROW_NUMBER partitioned by the requested grouping and ordered by numeric_value, recorded_at, and reading_id. Do not return a computed aggregate row.

Average, count, sum, totals, grouped scalar summaries, renamed columns, and any other result that cannot be represented as complete historical-reading records are deliberately unsupported in this milestone. They require the later A2UI milestone. Do not invent tables, columns, or evidence.

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
