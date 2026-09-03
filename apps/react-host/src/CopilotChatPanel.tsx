import {
  CopilotChat,
  CopilotKitProvider,
  UseAgentUpdate,
  useAgent,
  useAgentContext,
  useFrontendTool,
} from "@copilotkit/react-core/v2";
import { useEffect, useMemo } from "react";
import {
  clearFiltersToolSchema,
  getUserTimeZone,
  listConditionsToolSchema,
  listMetricsToolSchema,
  listRoomsToolSchema,
  listShiftManagersToolSchema,
  historianToolResultSchema,
  resolveFacilityViewAvailableOptions,
  setViewToolSchema,
  type ConfigureFacilityView,
  type HistorianToolResult,
  updateFiltersToolSchema,
} from "@packt-workshop/contracts";
import "@copilotkit/react-core/v2/styles.css";

type CopilotChatPanelProps = {
  viewContext: {
    view: "snapshot" | "reading-log";
    filters: Record<string, string | null>;
  };
  options: {
    rooms: { id: string; name: string }[];
    metrics: {
      id: string;
      name: string;
      label: string;
      roomId: string;
      roomName: string;
      kind: "numeric" | "state";
      unit: string | null;
    }[];
    shiftManagers: string[];
    conditions: readonly string[];
  };
  onConfigureView: (command: ConfigureFacilityView) => Promise<unknown>;
  onHistorianRun: (run: HistorianRun) => void;
};

export type HistorianRun = {
  toolCallId: string;
  result: HistorianToolResult;
};

export function parseHistorianResult(
  value: unknown,
): HistorianToolResult | undefined {
  try {
    const candidate = typeof value === "string" ? JSON.parse(value) : value;
    const parsed = historianToolResultSchema.safeParse(candidate);
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function latestHistorianRun(
  messages: readonly unknown[],
): HistorianRun | undefined {
  const queryToolCallIds = new Set<string>();
  for (const candidate of messages) {
    if (!candidate || typeof candidate !== "object") continue;
    const message = candidate as Record<string, unknown>;
    if (message.role !== "assistant" || !Array.isArray(message.toolCalls))
      continue;
    for (const candidateToolCall of message.toolCalls) {
      if (!candidateToolCall || typeof candidateToolCall !== "object") continue;
      const toolCall = candidateToolCall as {
        id?: unknown;
        function?: { name?: unknown };
      };
      if (
        typeof toolCall.id === "string" &&
        toolCall.function?.name === "query_historian"
      ) {
        queryToolCallIds.add(toolCall.id);
      }
    }
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const candidate = messages[index];
    if (!candidate || typeof candidate !== "object") continue;
    const message = candidate as Record<string, unknown>;
    if (
      message.role !== "tool" ||
      typeof message.toolCallId !== "string" ||
      typeof message.content !== "string" ||
      !queryToolCallIds.has(message.toolCallId)
    ) {
      continue;
    }
    const result = parseHistorianResult(message.content);
    if (result) return { toolCallId: message.toolCallId, result };
  }
  return undefined;
}

function FacilityChat({
  viewContext,
  options,
  onConfigureView,
  onHistorianRun,
}: CopilotChatPanelProps) {
  const { agent } = useAgent({
    agentId: "default",
    updates: [UseAgentUpdate.OnMessagesChanged],
  });
  const historianRun = useMemo(
    () => latestHistorianRun(agent.messages),
    [agent.messages],
  );
  useEffect(() => {
    if (historianRun) onHistorianRun(historianRun);
  }, [historianRun, onHistorianRun]);

  useAgentContext({
    description:
      "Current facility view, active filters, and user timezone. This context contains no option catalogs, readings, alarm records, or historian results.",
    value: { ...viewContext, userTimeZone: getUserTimeZone() },
  });
  useFrontendTool(
    {
      name: "list_rooms",
      description:
        "List the rooms currently supported by the facility application. Use this tool when the user asks which rooms exist or before selecting a room filter.",
      parameters: listRoomsToolSchema,
      agentId: "default",
      followUp: true,
      handler: async (input) => {
        const validation = listRoomsToolSchema.safeParse(input);
        if (!validation.success) {
          return invalidPayload(
            viewContext,
            validation.error.issues[0]?.message,
          );
        }
        return { rooms: options.rooms };
      },
    },
    [options.rooms, viewContext],
  );
  useFrontendTool(
    {
      name: "list_metrics",
      description:
        "List supported facility metrics. Optionally provide a room ID returned by list_rooms to restrict the result to that room.",
      parameters: listMetricsToolSchema,
      agentId: "default",
      followUp: true,
      handler: async (input) => {
        const validation = listMetricsToolSchema.safeParse(input);
        if (!validation.success) {
          return invalidPayload(
            viewContext,
            validation.error.issues[0]?.message,
          );
        }
        let roomId = validation.data.roomId;
        if (roomId) {
          try {
            const resolved = resolveFacilityViewAvailableOptions(
              { action: "update_filters", filters: { roomId } },
              options,
            );
            roomId =
              resolved.action === "update_filters"
                ? (resolved.filters.roomId ?? undefined)
                : roomId;
          } catch (error) {
            return {
              ok: false,
              error:
                error instanceof Error ? error.message : "Invalid room option.",
            };
          }
        }
        return {
          metrics: options.metrics.filter(
            (metric) => !roomId || metric.roomId === roomId,
          ),
        };
      },
    },
    [options, viewContext],
  );
  useFrontendTool(
    {
      name: "list_shift_managers",
      description:
        "List the shift managers currently available for reading-log filtering.",
      parameters: listShiftManagersToolSchema,
      agentId: "default",
      followUp: true,
      handler: async (input) => {
        const validation = listShiftManagersToolSchema.safeParse(input);
        if (!validation.success) {
          return invalidPayload(
            viewContext,
            validation.error.issues[0]?.message,
          );
        }
        return { shiftManagers: options.shiftManagers };
      },
    },
    [options.shiftManagers, viewContext],
  );
  useFrontendTool(
    {
      name: "list_conditions",
      description:
        "List the reading conditions supported by the reading-log filter.",
      parameters: listConditionsToolSchema,
      agentId: "default",
      followUp: true,
      handler: async (input) => {
        const validation = listConditionsToolSchema.safeParse(input);
        if (!validation.success) {
          return invalidPayload(
            viewContext,
            validation.error.issues[0]?.message,
          );
        }
        return { conditions: options.conditions };
      },
    },
    [options.conditions, viewContext],
  );
  useFrontendTool(
    {
      name: "set_view",
      description:
        "Switch the visible facility view between snapshot and reading-log. Existing filters are preserved.",
      parameters: setViewToolSchema,
      agentId: "default",
      followUp: true,
      handler: async (input) => {
        const validation = setViewToolSchema.safeParse(input);
        if (!validation.success) {
          return invalidPayload(
            viewContext,
            validation.error.issues[0]?.message,
          );
        }
        return onConfigureView({ action: "set_view", ...validation.data });
      },
    },
    [onConfigureView, viewContext],
  );
  useFrontendTool(
    {
      name: "update_filters",
      description:
        'Patch only the supplied reading-log filters and preserve all omitted filters. Use IDs returned by the list tools and the condition field returned by list_conditions. The literal "now" means the browser current time.',
      parameters: updateFiltersToolSchema,
      agentId: "default",
      followUp: true,
      handler: async (input) => {
        const validation = updateFiltersToolSchema.safeParse(input);
        if (!validation.success) {
          return invalidPayload(
            viewContext,
            validation.error.issues[0]?.message,
          );
        }
        return onConfigureView({
          action: "update_filters",
          ...validation.data,
        });
      },
    },
    [onConfigureView, viewContext],
  );
  useFrontendTool(
    {
      name: "clear_filters",
      description:
        "Clear the selected reading-log filters. Omit the filters list to clear every filter. The current view is preserved.",
      parameters: clearFiltersToolSchema,
      agentId: "default",
      followUp: true,
      handler: async (input) => {
        const validation = clearFiltersToolSchema.safeParse(input);
        if (!validation.success) {
          return invalidPayload(
            viewContext,
            validation.error.issues[0]?.message,
          );
        }
        return onConfigureView({ action: "clear_filters", ...validation.data });
      },
    },
    [onConfigureView, viewContext],
  );

  return (
    <CopilotChat
      agentId="default"
      labels={{
        chatInputPlaceholder: "Ask about this view or its history…",
        welcomeMessageText:
          "Ask me to adjust this view or query the read-only historian.",
        chatDisclaimerText:
          "Chat can adjust this view and run reviewed, read-only historian queries. It cannot perform operational actions.",
      }}
    />
  );
}

function invalidPayload(
  viewContext: CopilotChatPanelProps["viewContext"],
  message?: string,
) {
  return {
    ok: false,
    state: { view: viewContext.view, filters: viewContext.filters },
    error: message ?? "Invalid frontend tool payload.",
  };
}

export default function CopilotChatPanel(props: CopilotChatPanelProps) {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit" showDevConsole="auto">
      <FacilityChat {...props} />
    </CopilotKitProvider>
  );
}
