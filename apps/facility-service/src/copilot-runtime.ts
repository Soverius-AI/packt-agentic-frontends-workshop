import type { AbstractAgent } from "@ag-ui/client";
import type { Message, RunAgentInput } from "@ag-ui/core";
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { MastraClient } from "@mastra/client-js";
import { createRequire } from "node:module";

// The bridge's ESM bundle imports named exports from a CommonJS dependency.
// Loading its supported CommonJS export avoids that Node-only interop failure.
const nodeRequire = createRequire(import.meta.url);
const { MastraAgent } = nodeRequire(
  "@ag-ui/mastra",
) as typeof import("@ag-ui/mastra");

export type CopilotRuntimeOptions = {
  mastraBaseUrl?: string | undefined;
};

// Keep rendered data in the browser, out of the next request to Mastra.
export function withoutHistorianPayloads(messages: Message[]): Message[] {
  const calls = new Set(
    messages.flatMap((message) =>
      message.role === "assistant"
        ? (message.toolCalls ?? [])
            .filter((call) => call.function.name === "query_historian")
            .map((call) => call.id)
        : [],
    ),
  );
  return messages
    .filter(
      (message) =>
        message.role !== "activity" || message.activityType !== "a2ui-surface",
    )
    .map((message) =>
      message.role === "tool" && calls.has(message.toolCallId)
        ? {
            ...message,
            content:
              "The previous query result was delivered to the application.",
          }
        : message,
    );
}

// MastraAgent.clone() drops attached middleware; keep this boundary on every clone.
export class HistorianBridge extends MastraAgent {
  constructor(
    private readonly options: ConstructorParameters<typeof MastraAgent>[0],
  ) {
    super(options);
  }

  override clone() {
    return new HistorianBridge(this.options);
  }

  override run(input: RunAgentInput): ReturnType<AbstractAgent["run"]> {
    return super.run({
      ...input,
      messages: withoutHistorianPayloads(input.messages),
    });
  }
}

export const createWorkshopCopilotRuntime = (
  options: CopilotRuntimeOptions = {},
) => {
  const mastraClient = new MastraClient({
    baseUrl: options.mastraBaseUrl ?? "http://127.0.0.1:4211",
  });
  const remoteAgent = mastraClient.getAgent("default");
  const agent = new HistorianBridge({
    agent: remoteAgent,
    resourceId: "workshop-chat",
  }) as unknown as AbstractAgent;
  const runtime = new CopilotRuntime({
    a2ui: { injectA2UITool: false },
    agents: {
      // The bridge and runtime share AG-UI 0.0.57 at runtime, but pnpm's
      // peer-isolated declarations give AbstractAgent's private fields
      // separate TypeScript identities.
      default: agent,
    },
  });

  return createCopilotNodeListener({
    runtime,
    basePath: "/api/copilotkit",
    cors: false,
  });
};
