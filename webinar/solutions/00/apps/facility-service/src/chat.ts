import type { ChatMessage } from "@packt-workshop/contracts";
import { CHAT_SYSTEM_PROMPT } from "./prompts/basic-chat.js";
import OpenAI from "openai";
import { getOrThrow } from "@packt-workshop/common/assert-defined";

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

export function createChatClient(apiKey: string, model: string): ChatService {
  // Live step: implement the OpenAI client and reply function here.
  throw new ChatServiceError("Basic chat client is not implemented yet.", 503);
}
