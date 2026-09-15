import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { z } from "zod";

// Workflow-private, tool-free agent for the generate-sql step.

export const SQL_GENERATOR_INSTRUCTIONS = `Generate one read-only SQLite SELECT or WITH query answering the operator's question.

Available view: historian_readings
- reading_id, recorded_at (ISO-8601 UTC with T/Z)
- room_id, room_name, room_area_type, room_description
- metric_id, metric_name, unit, numeric_value, text_value
- shift_manager_name, condition (normal, warning, critical, unavailable)
Exact room names: Cooling room, Packaging hall.
Exact metric names: Air temperature, Relative humidity, Product surface temperature, Supply-air temperature, Cooling-unit power, Line state, Line speed, Seal temperature, Package reject rate.
Unqualified "temperature" means Air temperature. Never invent fields or filter values.

Choose data sufficient for the presentation:
- Requests to show, select, hide or reorder reading columns MUST use SELECT *, even when only two columns should be visible. The frontend chooses visible columns.
- Grouped readings or expandable details also need SELECT * with the requested filters and ordering; the frontend computes summaries from those rows.
- Room descriptions without readings: SELECT DISTINCT room_id, room_name, room_area_type, room_description.
- Summaries without details: scalar aggregates with unique snake_case aliases are allowed. Keep different metrics and units separate. A "maximum reading" needs the stored row, not just its maximum value.

Return at most 24 scalar columns. Use LIMIT only for an explicitly requested top-N dataset, never to shorten data needed for summaries. Honor explicit date bounds; otherwise use ISO UTC bounds such as strftime('%Y-%m-%dT%H:%M:%fZ','now','-7 days'). Return SQL and a short explanation using the supplied schema.`;

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
