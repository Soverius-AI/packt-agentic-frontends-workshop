import OpenAI from "openai";
import type { ChatMessage } from "@packt-workshop/contracts";

export type ModelMessage = ChatMessage | { role: "system"; content: string };

export async function completeBasicChat(
  messages: readonly ModelMessage[],
  model: string,
  apiKey: string,
): Promise<string> {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  const completion = await client.chat.completions.create({
    model,
    messages: [...messages],
  });
  return completion.choices[0]?.message.content?.trim() ?? "";
}
