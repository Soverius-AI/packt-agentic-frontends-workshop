import { createOpenAI } from "@ai-sdk/openai";
import { ToolCallFilter } from "@mastra/core/processors";
import { Agent } from "@mastra/core/agent";
import { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";
import { createQueryHistorianTool } from "./tools/query-historian-tool";

// Optional conversational entry point in Mastra Studio. The application calls the workflow directly.

export const CHAT_SYSTEM_PROMPT = `You investigate historical readings in the Soverius Chocolate Factory. Use query_historian once with the operator's complete question. It generates SQL, reviews it and enforces read-only execution. Do not invent readings or generate SQL yourself. Explain rejection honestly. You cannot change the application or raise alarms.`;

export const createMainAgent = (
  apiKey: string,
  model: string,
  historianQueryWorkflow: ReturnType<typeof createHistorianQueryWorkflow>,
) => {
  const openrouter = createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  const query_historian = createQueryHistorianTool(historianQueryWorkflow);

  return new Agent({
    id: "default",
    name: "Soverius Chocolate Factory Assistant",
    description:
      "A backend assistant with one reviewed, read-only historian workflow.",
    instructions: CHAT_SYSTEM_PROMPT,
    model: openrouter(model),
    inputProcessors: [new ToolCallFilter({ exclude: ["query_historian"] })],
    tools: { query_historian },
  });
};
