import {
  CopilotChat,
  CopilotKitProvider,
  useAgentContext,
  useFrontendTool,
  useRenderTool,
} from "@copilotkit/react-core/v2";
import {
  clearFiltersToolSchema,
  listConditionsToolSchema,
  listMetricsToolSchema,
  listRoomsToolSchema,
  listShiftManagersToolSchema,
  historianToolResultSchema,
  queryHistorianToolSchema,
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

function HistorianResult({
  status,
  sql,
  result,
}: {
  status: "inProgress" | "executing" | "complete";
  sql?: string | undefined;
  result?: unknown;
}) {
  const historianResult = parseHistorianResult(result);
  return (
    <article className="historian-card" aria-live="polite">
      <header>
        <div>
          <p>Reviewed historian query</p>
          <strong>SQL → reviewer → deterministic policy</strong>
        </div>
        <span>{status === "complete" ? "Complete" : "Checking…"}</span>
      </header>
      {sql && (
        <details>
          <summary>Generated SQL</summary>
          <pre>
            <code>{sql}</code>
          </pre>
        </details>
      )}
      {historianResult ? (
        <>
          <p
            className={`historian-review${historianResult.review.approved ? "" : " rejected"}`}
          >
            <strong>Reviewer:</strong> {historianResult.review.summary}
          </p>
          {historianResult.status === "executed" ? (
            <>
              <div className="historian-result-meta">
                <span>Policy {historianResult.policyVersion}</span>
                <span>{historianResult.rowCount} rows</span>
                <span>{historianResult.durationMs} ms</span>
              </div>
              <div
                className="historian-table-shell"
                tabIndex={0}
                aria-label="Historian query result table"
              >
                <table>
                  <caption>
                    Result of the reviewed, read-only historian query
                  </caption>
                  <thead>
                    <tr>
                      {historianResult.columns.map((column, index) => (
                        <th scope="col" key={`${column}-${index}`}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historianResult.rows.length ? (
                      historianResult.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((value, columnIndex) => (
                            <td key={columnIndex}>{value ?? "—"}</td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={historianResult.columns.length || 1}>
                          No matching readings.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {historianResult.truncated && (
                <p className="historian-notice">
                  Result truncated at the deterministic row limit.
                </p>
              )}
            </>
          ) : (
            <p className="historian-rejection">
              <strong>{historianResult.stage} rejected the query:</strong>{" "}
              {historianResult.message}
            </p>
          )}
        </>
      ) : status === "complete" ? (
        <p className="historian-rejection">
          The historian returned an unreadable result.
        </p>
      ) : (
        <p className="historian-pending">
          Reviewing meaning before applying the deterministic SQL policy…
        </p>
      )}
    </article>
  );
}

function FacilityChat({
  viewContext,
  options,
  onConfigureView,
}: CopilotChatPanelProps) {
  useAgentContext({
    description:
      "Current facility view and active filters. This context contains no option catalogs, readings, or historian results.",
    value: viewContext,
  });
  useRenderTool({
    name: "query_historian",
    parameters: queryHistorianToolSchema,
    render: ({ status, parameters, result }) => (
      <HistorianResult status={status} sql={parameters.sql} result={result} />
    ),
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
