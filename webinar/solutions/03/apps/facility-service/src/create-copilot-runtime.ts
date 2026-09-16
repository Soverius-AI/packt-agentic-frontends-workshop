import type { ChatMessage } from "@packt-workshop/contracts";
import { CHAT_SYSTEM_PROMPT } from "./prompts/basic-chat.js";
import OpenAI from "openai";
import { getOrThrow } from "@packt-workshop/common/assert-defined";
import { createOpenAI } from "@ai-sdk/openai";
import { BuiltInAgent, CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

export interface ChatService {
  reply: (messages: ChatMessage[]) => Promise<ChatMessage>;
}

export class ChatServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

export function createChatClient(apiKey: string, model: string) {
  const openRouterProvider = createOpenAI({
    apiKey, baseURL: 'https://openrouter.ai/api/v1'
  })

  const runtime = new CopilotRuntime({
    agents: {
      default: new BuiltInAgent({
        model: openRouterProvider(model),
        prompt: CHAT_SYSTEM_PROMPT
      })
    }
  });

  return createCopilotNodeListener({
    runtime: runtime,
    cors: false
  })
}
