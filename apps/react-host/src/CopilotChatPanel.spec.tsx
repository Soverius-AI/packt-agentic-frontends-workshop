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

  it("registers bounded context and seven focused frontend tools", async () => {
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
    };
    const options = {
      rooms: [{ id: "cooling-room", name: "Cooling room" }],
      metrics: [
        {
          id: "cooling-air-temperature",
          name: "Air temperature",
          label: "Cooling room · Air temperature",
          roomId: "cooling-room",
          roomName: "Cooling room",
          kind: "numeric" as const,
          unit: "°C",
        },
      ],
      shiftManagers: ["Charles Bond"],
      conditions: ["normal", "warning", "critical", "unavailable"],
    };

    await act(async () => {
      root.render(
        <CopilotChatPanel
          viewContext={viewContext}
          options={options}
          onConfigureView={onConfigureView}
        />,
      );
    });

    expect(hooks.useAgentContext).toHaveBeenCalledWith(
      expect.objectContaining({ value: viewContext }),
    );
    const registrations = hooks.useFrontendTool.mock.calls.map(
      ([tool]) => tool,
    );
    expect(registrations.map(({ name }) => name)).toEqual([
      "list_rooms",
      "list_metrics",
      "list_shift_managers",
      "list_conditions",
      "set_view",
      "update_filters",
      "clear_filters",
    ]);
    expect(registrations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "list_rooms", agentId: "default" }),
        expect.objectContaining({ name: "list_metrics", agentId: "default" }),
        expect.objectContaining({
          name: "list_shift_managers",
          agentId: "default",
        }),
        expect.objectContaining({
          name: "list_conditions",
          agentId: "default",
        }),
        expect.objectContaining({ name: "set_view", agentId: "default" }),
        expect.objectContaining({ name: "update_filters", agentId: "default" }),
        expect.objectContaining({ name: "clear_filters", agentId: "default" }),
      ]),
    );

    await expect(registrations[0].handler({})).resolves.toEqual({
      rooms: options.rooms,
    });
    await expect(
      registrations[1].handler({ roomId: "Cooling room" }),
    ).resolves.toEqual({ metrics: options.metrics });
    await expect(registrations[2].handler({})).resolves.toEqual({
      shiftManagers: options.shiftManagers,
    });
    await expect(registrations[3].handler({})).resolves.toEqual({
      conditions: options.conditions,
    });

    await registrations[4].handler({ view: "snapshot" });
    await registrations[5].handler({ filters: { from: "now" } });
    await registrations[6].handler({ filters: ["from"] });

    expect(onConfigureView.mock.calls).toEqual([
      [{ action: "set_view", view: "snapshot" }],
      [{ action: "update_filters", filters: { from: "now" } }],
      [{ action: "clear_filters", filters: ["from"] }],
    ]);
  });
});
