import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { z } from "zod";

export const SQL_GENERATOR_INSTRUCTIONS = `Generate one read-only SQLite SELECT or WITH query and a short explanation.

View: historian_readings
Always return all these output columns: reading_id, recorded_at, room_id, room_name, metric_id, metric_name, unit, numeric_value, text_value, shift_manager_name, condition.
recorded_at is ISO-8601 UTC. condition is normal, warning, critical, or unavailable.
Rooms: Cooling room, Packaging hall.
Metrics: Air temperature, Relative humidity, Product surface temperature, Supply-air temperature, Cooling-unit power, Line state, Line speed, Seal temperature, Package reject rate.
Use exact catalog values. Unqualified "temperature" means Air temperature.

For highest/lowest reading requests, select the complete stored row, retaining its timestamp, room, metric, and condition. Per group, use ROW_NUMBER; break ties by latest recorded_at, then reading_id. Exclude the ranking column from the final output.
MAX, MIN, and AVG are supported as numeric_value. For aggregate results, return every column; retain metadata that has one value within the group, otherwise return NULL under that column's name. Never select ungrouped, non-aggregated metadata alongside an aggregate. Do not invent output columns.
Example for average air temperature per shift manager:
SELECT NULL AS reading_id, NULL AS recorded_at, NULL AS room_id, NULL AS room_name, NULL AS metric_id, metric_name, unit, AVG(numeric_value) AS numeric_value, NULL AS text_value, shift_manager_name, NULL AS condition FROM historian_readings WHERE metric_name = 'Air temperature' GROUP BY shift_manager_name, metric_name, unit.`;

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
