// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

class EventSourceStub {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
}

const dashboard = {
  siteName: "Soverius Chocolate Bar",
  generatedAt: "2026-08-24T20:00:00.000Z",
  activeAlarmCount: 0,
  shiftManagers: [],
  rooms: [],
};

describe("React basic chat", () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal("EventSource", EventSourceStub);
    fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/dashboard") {
        return { ok: true, json: async () => dashboard };
      }
      if (url === "/api/chat") {
        const request = JSON.parse(String(init?.body)) as {
          messages: Array<{ role: string; content: string }>;
        };
        return {
          ok: true,
          json: async () => ({
            message: {
              role: "assistant",
              content:
                request.messages.length === 1
                  ? "A warning marks a condition that needs attention."
                  : "I cannot inspect the Cooling room history.",
            },
          }),
        };
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => {
      root.render(<App />);
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  const enterMessage = (textarea: HTMLTextAreaElement, value: string): void => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    setter?.call(textarea, value);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  };

  it("sends the complete conversation without facility state", async () => {
    const textarea =
      container.querySelector<HTMLTextAreaElement>("#chat-message")!;
    const form = container.querySelector<HTMLFormElement>(".chat-form")!;

    await act(async () => {
      enterMessage(textarea, "What does a warning mean?");
    });
    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    await act(async () => {
      enterMessage(textarea, "When did the Cooling room enter warning?");
    });
    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    const chatRequests = fetchMock.mock.calls.filter(
      ([url]) => url === "/api/chat",
    );
    expect(chatRequests).toHaveLength(2);
    const secondBody = JSON.parse(String(chatRequests[1]?.[1]?.body)) as {
      messages: unknown[];
    };
    expect(secondBody.messages).toEqual([
      { role: "user", content: "What does a warning mean?" },
      {
        role: "assistant",
        content: "A warning marks a condition that needs attention.",
      },
      { role: "user", content: "When did the Cooling room enter warning?" },
    ]);
    expect(JSON.stringify(secondBody)).not.toContain("currentNumericValue");
    expect(container.querySelector(".conversation")?.textContent).toContain(
      "I cannot inspect the Cooling room history.",
    );
  });
});
