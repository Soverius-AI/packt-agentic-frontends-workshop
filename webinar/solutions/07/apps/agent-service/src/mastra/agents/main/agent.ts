import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { CHAT_SYSTEM_PROMPT } from "../../prompts/webinar-07";
import { createTool } from "@mastra/core/tools";
import { ToolCallFilter } from "@mastra/core/processors";


export function createAgent(apiKey: string, model: string, historianTool: ReturnType<typeof createTool>) {
  const openRouterProvider = createOpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1'
  })

  return new Agent({
    id: 'default',
    name: 'Soverius Chocolate Factory',
    model: openRouterProvider(model),
    instructions: CHAT_SYSTEM_PROMPT,
    tools: { query_historian: historianTool },
    inputProcessors: [new ToolCallFilter({ exclude: ['query_historian'] })]
  })
}