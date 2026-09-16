import type { ChatMessage } from "@packt-workshop/contracts";
import { CHAT_SYSTEM_PROMPT } from "./prompts/basic-chat.js";
import OpenAI from "openai";
import { getOrThrow } from "@packt-workshop/common/assert-defined";
import { createOpenAI } from "@ai-sdk/openai";
import { BuiltInAgent, CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { MastraClient } from "@mastra/client-js";
import { AbstractAgent } from "@ag-ui/client";
import { HistorianBridge } from "./copilot-runtime.js";


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

export function createChatClient() {
  const mastraClient = new MastraClient({
    baseUrl: "http://localhost:4211"
  })

  const mastraAgent: AbstractAgent = new HistorianBridge({
    agent: mastraClient.getAgent('default')
  })

  const runtime = new CopilotRuntime({
    a2ui: { injectA2UITool: false },
    agents: {
      default: mastraAgent
    }
  });

  return createCopilotNodeListener({
    runtime: runtime,
    cors: false
  })
}
