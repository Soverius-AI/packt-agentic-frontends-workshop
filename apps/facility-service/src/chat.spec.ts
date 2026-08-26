import { describe, expect, it, vi } from "vitest";
import {
  CHAT_SYSTEM_PROMPT,
  ChatServiceError,
  DEFAULT_OPENROUTER_MODEL,
  createChatService,
} from "./chat.js";

describe("basic chat service", () => {
  it("adds only static application context and preserves the conversation", async () => {
    const complete = vi.fn(async () => "I cannot inspect the historian yet.");
    const service = createChatService({ complete });
    const response = await service.reply([
      { role: "user", content: "What does a warning mean?" },
      {
        role: "assistant",
        content: "It marks a condition that needs attention.",
      },
      { role: "user", content: "When did the Cooling room enter warning?" },
    ]);

    expect(response).toEqual({
      message: {
        role: "assistant",
        content: "I cannot inspect the historian yet.",
      },
    });
    expect(complete).toHaveBeenCalledWith(
      [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        { role: "user", content: "What does a warning mean?" },
        {
          role: "assistant",
          content: "It marks a condition that needs attention.",
        },
        { role: "user", content: "When did the Cooling room enter warning?" },
      ],
      DEFAULT_OPENROUTER_MODEL,
    );
  });

  it("returns a clear configuration error without exposing a secret", async () => {
    const service = createChatService();

    await expect(
      service.reply([{ role: "user", content: "Hello" }]),
    ).rejects.toEqual(
      new ChatServiceError(
        "Chat is not configured. Set OPENROUTER_API_KEY on the backend.",
        503,
      ),
    );
  });

  it("converts provider failures into a recoverable public error", async () => {
    const service = createChatService({
      complete: async () => {
        throw new Error("provider details");
      },
    });

    await expect(
      service.reply([{ role: "user", content: "Hello" }]),
    ).rejects.toEqual(
      new ChatServiceError(
        "The chat provider is unavailable. Please try again.",
        502,
      ),
    );
  });
});
