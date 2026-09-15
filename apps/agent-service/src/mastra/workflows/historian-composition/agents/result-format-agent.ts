import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { resultFormatSchema, type ExecutedData } from "../schemas";

// Workflow-private agent: decides how to return the answer after query execution.
export function createResultFormatAgent(apiKey: string, model: string) {
  const openrouter = createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  return new Agent({
    id: "result-format",
    name: "Historian Result Format",
    instructions: `Choose the result format from the question and result columns.
Use "ui" for requested tables, cards, column selection, grouped readings or other visual layouts, including cards without tables and tables without cards.
Use "data" for factual or plain-language answers, explicit requests for no UI, and requests without a visual preference. An aggregate alone does not require UI.
Return only the format using the supplied schema.`,
    model: openrouter(model),
  });
}

export function createResultFormatFunction(
  agent: ReturnType<typeof createResultFormatAgent>,
) {
  return async (result: ExecutedData) => {
    const response = await agent.generate(
      JSON.stringify({
        question: result.question,
        columns: result.data.columns,
        rowCount: result.data.rowCount,
      }),
      {
        abortSignal: AbortSignal.timeout(30_000),
        maxSteps: 1,
        modelSettings: { temperature: 0, maxOutputTokens: 128 },
        structuredOutput: {
          schema: resultFormatSchema,
          jsonPromptInjection: "auto",
        },
      },
    );
    return resultFormatSchema.parse(response.object);
  };
}
