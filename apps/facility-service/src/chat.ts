import type { ChatMessage, ChatResponse } from "@packt-workshop/contracts";
import OpenAI from "openai";

export const DEFAULT_OPENROUTER_MODEL = "google/gemma-4-31b-it";

import { CHAT_SYSTEM_PROMPT } from "./prompts/basic-chat.js";

type ModelMessage = ChatMessage | { role: "system"; content: string };

type CompleteChat = (
  messages: readonly ModelMessage[],
  model: string,
) => Promise<string>;

export class ChatServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

export type ChatService = {
  reply(messages: readonly ChatMessage[]): Promise<ChatResponse>;
};

export const createChatService = (options?: {
  apiKey?: string | undefined;
  model?: string | undefined;
  complete?: CompleteChat;
}): ChatService => {
  const apiKey = options?.apiKey;
  const model = options?.model || DEFAULT_OPENROUTER_MODEL;
  const client = apiKey
    ? new OpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
      })
    : undefined;
  const complete =
    options?.complete ??
    (async (messages: readonly ModelMessage[], selectedModel: string) => {
      if (!client) {
        throw new ChatServiceError(
          "Chat is not configured. Set OPENROUTER_API_KEY on the backend.",
          503,
        );
      }
      const completion = await client.chat.completions.create({
        model: selectedModel,
        messages: [...messages],
      });
      const content = completion.choices[0]?.message.content?.trim();
      if (!content) {
        throw new ChatServiceError(
          "The model returned an empty response. Please try again.",
          502,
        );
      }
      return content;
    });

  return {
    async reply(messages) {
      try {
        const content = await complete(
          [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...messages],
          model,
        );
        return { message: { role: "assistant", content } };
      } catch (error) {
        if (error instanceof ChatServiceError) throw error;
        throw new ChatServiceError(
          "The chat provider is unavailable. Please try again.",
          502,
        );
      }
    },
  };
};
