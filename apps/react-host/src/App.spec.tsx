// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./CopilotChatPanel", () => ({
  default: ({
    viewContext,
    options,
    onConfigureView,
  }: {
    viewContext: unknown;
    options: unknown;
    onConfigureView: (command: unknown) => Promise<unknown>;
  }) => (
    <div data-testid="copilot-chat">
      CopilotKit chat
      <pre data-testid="view-context">{JSON.stringify(viewContext)}</pre>
      <pre data-testid="facility-options">{JSON.stringify(options)}</pre>
      <button
        data-testid="set-view"
        onClick={() =>
          void onConfigureView({ action: "set_view", view: "reading-log" })
        }
      >
        Set view
      </button>
      <button
        data-testid="configure-view"
        onClick={() =>
          void onConfigureView({
            action: "update_filters",
            filters: {
              from: "2026-08-25T08:00",
              roomId: "cooling-room",
              condition: "warning",
            },
          })
        }
      >
        Configure view
      </button>
      <button
        data-testid="change-date"
        onClick={() =>
          void onConfigureView({
            action: "update_filters",
            filters: { from: "now" },
          })
        }
      >
        Change date
      </button>
    </div>
  ),
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
  shiftManagers: ["Denise Weber"],
  rooms: [
    {
      id: "cooling-room",
      name: "Cooling room",
      areaType: "Chocolate conditioning and storage",
      description: "Chocolate rests before packaging.",
      metrics: [
        {
          id: "cooling-air-temperature",
          roomId: "cooling-room",
          equipmentName: null,
          name: "Air temperature",
          kind: "numeric",
          unit: "°C",
          currentNumericValue: 21.4,
          currentTextValue: null,
          shiftManagerName: "Denise Weber",
          condition: "warning",
          trend: "Rising for 30 min",
          target: "16–18 °C",
          detail: "Persisted facility measurement.",
          updatedAt: "2026-08-24T20:00:00.000Z",
          activeAlarm: null,
        },
      ],
    },
  ],
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
      if (url.startsWith("/api/readings?")) {
        return {
          ok: true,
          json: async () => ({ entries: [], total: 0, limit: 50, offset: 0 }),
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

  it("presents the Step 5 frontend-tool milestone without a custom chat transport", () => {
    expect(container.textContent).toContain("Stage 5 · Frontend tools");
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

  it("patches the date without resetting the rest of the frontend state", async () => {
    await act(async () => {
      await vi.waitFor(() => {
        const options = JSON.parse(
          container.querySelector('[data-testid="facility-options"]')
            ?.textContent ?? "{}",
        ) as { rooms?: unknown[] };
        expect(options.rooms).toHaveLength(1);
      });
    });
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('[data-testid="set-view"]')
        ?.click();
      container
        .querySelector<HTMLButtonElement>('[data-testid="configure-view"]')
        ?.click();
    });
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('[data-testid="change-date"]')
        ?.click();
    });

    const context = JSON.parse(
      container.querySelector('[data-testid="view-context"]')?.textContent ??
        "{}",
    ) as {
      view: string;
      filters: Record<string, string | null>;
    };
    expect(context.view).toBe("reading-log");
    expect(context.filters.from).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(context.filters.roomId).toBe("cooling-room");
    expect(context.filters.condition).toBe("warning");
  });
});
