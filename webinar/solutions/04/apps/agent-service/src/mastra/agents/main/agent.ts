import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-04";


export function createAgent(apiKey: string, model: string) {
  const openRouterProvider = createOpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1'
  })

  return new Agent({
    id: 'default',
    name: 'Soverius Chocolate Factory',
    model: openRouterProvider(model),
    instructions: CHAT_SYSTEM_PROMPT,
    tools: {}
  })
}