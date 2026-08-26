// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./CopilotChatPanel", () => ({
  default: () => <div data-testid="copilot-chat">CopilotKit chat</div>,
}));

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

describe("React CopilotKit host", () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal("EventSource", EventSourceStub);
    fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/dashboard") {
        return { ok: true, json: async () => dashboard };
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

  it("presents the Step 3 CopilotKit milestone without a custom chat transport", () => {
    expect(container.textContent).toContain("Stage 3 · CopilotKit + AG-UI");
    expect(
      container.querySelector('[data-testid="copilot-chat"]'),
    ).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/dashboard",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/chat")).toBe(
      false,
    );
  });
});
