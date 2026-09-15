import type { ChatMessage } from "@packt-workshop/contracts";

export type ModelMessage = ChatMessage | { role: "system"; content: string };

export async function completeBasicChat(
  _messages: readonly ModelMessage[],
  _model: string,
  _apiKey: string,
): Promise<string> {
  // Milestone 02: create the OpenAI client and request a completion here.
  throw new Error("The basic chat model connection is not implemented yet.");
}
