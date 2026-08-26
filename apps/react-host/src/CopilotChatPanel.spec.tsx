// @vitest-environment jsdom

import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CopilotChatPanel from "./CopilotChatPanel";

const hooks = vi.hoisted(() => ({
  useAgentContext: vi.fn(),
  useFrontendTool: vi.fn(),
}));

vi.mock("@copilotkit/react-core/v2", () => ({
  CopilotKitProvider: ({ children }: { children: ReactNode }) => children,
  CopilotChat: () => <div data-testid="copilot-chat">CopilotKit chat</div>,
  useAgentContext: hooks.useAgentContext,
  useFrontendTool: hooks.useFrontendTool,
}));

describe("CopilotChatPanel", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it("registers bounded context and the shared frontend tool", async () => {
    const onConfigureView = vi.fn(async () => ({ ok: true }));
    const viewContext = {
      view: "reading-log" as const,
      filters: {
        from: "2026-08-25T08:00",
        to: null,
        shiftManager: "Charles Bond",
        roomId: "cooling-room",
        metricId: null,
        condition: "warning",
      },
      availableFilters: {
        rooms: [{ id: "cooling-room", name: "Cooling room" }],
        metrics: [
          {
            id: "cooling-air-temperature",
            label: "Cooling room · Air temperature",
          },
        ],
        shiftManagers: ["Charles Bond"],
        conditions: ["normal", "warning", "critical", "unavailable"],
      },
    };

    await act(async () => {
      root.render(
        <CopilotChatPanel
          viewContext={viewContext}
          onConfigureView={onConfigureView}
        />,
      );
    });

    expect(hooks.useAgentContext).toHaveBeenCalledWith(
      expect.objectContaining({ value: viewContext }),
    );
    expect(hooks.useFrontendTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "configure_facility_view",
        agentId: "default",
        handler: onConfigureView,
      }),
      [onConfigureView],
    );
  });
});
