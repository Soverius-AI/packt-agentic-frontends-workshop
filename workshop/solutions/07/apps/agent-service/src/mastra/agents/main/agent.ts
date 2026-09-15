import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import type { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";
import { createQueryHistorianTool } from "./tools/query-historian-tool";
import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-07";

export const historianEnabled = true;
export function createMainAgent(
  apiKey: string,
  model: string,
  workflow: ReturnType<typeof createHistorianQueryWorkflow>,
) {
  const openrouter = createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  return new Agent({
    id: "default",
    name: "Soverius Chocolate Factory Assistant",
    instructions: CHAT_SYSTEM_PROMPT,
    model: openrouter(model),
    tools: { query_historian: createQueryHistorianTool(workflow) },
  });
}
