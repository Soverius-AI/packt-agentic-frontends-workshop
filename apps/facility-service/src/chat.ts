import type { ChatMessage, ChatResponse } from "@packt-workshop/contracts";
import OpenAI from "openai";

export const DEFAULT_OPENROUTER_MODEL = "google/gemma-4-31b-it";

export const CHAT_SYSTEM_PROMPT = `You are the assistant embedded in the Soverius Chocolate Factory incident-management application.

The application monitors rooms, equipment, metrics, warnings, alarms, and historical readings. Users may refer to concepts and names they see in this application.

You can use the conversation and this static description only. You cannot access the application's current state, visible UI, readings, history, database, or actions. Never invent application data. Clearly say when answering would require access you do not have.

You should be able to answer basic questions for the domain of food industry.`;

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
