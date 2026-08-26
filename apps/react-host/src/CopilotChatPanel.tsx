import {
  CopilotChat,
  CopilotKitProvider,
  useAgentContext,
  useFrontendTool,
} from "@copilotkit/react-core/v2";
import {
  configureFacilityViewSchema,
  type ConfigureFacilityView,
} from "@packt-workshop/contracts";
import "@copilotkit/react-core/v2/styles.css";

type CopilotChatPanelProps = {
  viewContext: {
    view: "snapshot" | "reading-log";
    filters: Record<string, string | null>;
    availableFilters: {
      rooms: { id: string; name: string }[];
      metrics: { id: string; label: string }[];
      shiftManagers: string[];
      conditions: string[];
    };
  };
  onConfigureView: (command: ConfigureFacilityView) => Promise<unknown>;
};

function FacilityChat({ viewContext, onConfigureView }: CopilotChatPanelProps) {
  useAgentContext({
    description:
      "Current facility view, active filters, and available filter options. This context contains no readings or historian results.",
    value: viewContext,
  });
  useFrontendTool(
    {
      name: "configure_facility_view",
      description:
        'Update the visible facility view and reading-log filters. Updates are patches: omit every value that should remain unchanged. Use the literal "now" for the browser current time. Use clear_filters without a filters list to clear all filters, or provide filter names to clear only those filters.',
      parameters: configureFacilityViewSchema,
      agentId: "default",
      followUp: true,
      handler: onConfigureView,
    },
    [onConfigureView],
  );

  return (
    <CopilotChat
      agentId="default"
      labels={{
        chatInputPlaceholder: "Ask the assistant to adjust this view…",
        welcomeMessageText:
          "Ask me to switch views or configure the reading-log filters.",
        chatDisclaimerText:
          "Chat can adjust this view and its filters, but cannot inspect readings or perform operational actions.",
      }}
    />
  );
}

export default function CopilotChatPanel(props: CopilotChatPanelProps) {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit" showDevConsole="auto">
      <FacilityChat {...props} />
    </CopilotKitProvider>
  );
}
