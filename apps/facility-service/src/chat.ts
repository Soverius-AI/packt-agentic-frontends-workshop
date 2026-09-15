import type { ChatMessage } from "@packt-workshop/contracts";
import { CHAT_SYSTEM_PROMPT } from "./prompts/basic-chat.js";
import OpenAI from "openai";
import { getOrThrow } from "@packt-workshop/common/assert-defined";

export interface ChatService {
  reply: (messages: ChatMessage[]) => Promise<ChatMessage>;
}

export class ChatServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
  }
}

export function createChatClient(apiKey: string, model: string) {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  return {
    reply: async (messages: ChatMessage[]): Promise<ChatMessage> => {
      const completions = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: CHAT_SYSTEM_PROMPT },
          ...messages,
        ],
      });

      const { message } = getOrThrow(completions.choices[0]);

      return { ...message, content: message.content ?? "" };
    },
  };
}
