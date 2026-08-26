import { CopilotChat, CopilotKitProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

export default function CopilotChatPanel() {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit" showDevConsole="auto">
      <CopilotChat
        agentId="default"
        labels={{
          chatInputPlaceholder: "Ask about incident management…",
          welcomeMessageText:
            "Ask a general question about incident management.",
          chatDisclaimerText:
            "Chat cannot access current facility data or perform actions.",
        }}
      />
    </CopilotKitProvider>
  );
}
