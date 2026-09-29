import {
  EventType,
  type BaseEvent,
  type ActivitySnapshotEvent,
  type Message,
  type RunAgentInput,
} from "@ag-ui/core";
import type { AbstractAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { MastraClient } from "@mastra/client-js";
import { Observable } from "rxjs";
import { withWorkflowActivities } from "./investigation-progress.js";
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
  return messages.map((message) =>
    message.role === "tool" && calls.has(message.toolCallId)
      ? {
          ...message,
          content:
            "The previous query result was delivered to the application.",
        }
      : message,
  );
}

// Keep the workflow event adapter on every bridge clone.
export class HistorianBridge extends MastraAgent {
  constructor(
    private readonly options: ConstructorParameters<typeof MastraAgent>[0] & {
      agent: ReturnType<MastraClient["getAgent"]>;
    },
  ) {
    super(options);
  }

  override clone() {
    return new HistorianBridge(this.options);
  }

  override run(input: RunAgentInput): ReturnType<AbstractAgent["run"]> {
    return new Observable<BaseEvent>((subscriber) => {
      const pending = new Map<string, ActivitySnapshotEvent>();
      const emit = (activity: ActivitySnapshotEvent) => {
        if (activity.content.status === "running")
          pending.set(activity.messageId, activity);
        else pending.delete(activity.messageId);
        subscriber.next(activity);
      };
      const failPending = () => {
        for (const activity of pending.values()) {
          subscriber.next({
            ...activity,
            content: {
              ...activity.content,
              status: "failed",
              message: "Investigation ended without a result",
            },
          });
        }
        pending.clear();
      };
      const bridge = new MastraAgent({
        ...this.options,
        agent: withWorkflowActivities(this.options.agent, emit),
      });
      return bridge
        .run({ ...input, messages: withoutHistorianPayloads(input.messages) })
        .subscribe({
          next: (event) => {
            if (
              event.type === EventType.RUN_ERROR ||
              event.type === EventType.RUN_FINISHED
            )
              failPending();
            subscriber.next(event);
          },
          error: (error) => {
            failPending();
            subscriber.error(error);
          },
          complete: () => {
            failPending();
            subscriber.complete();
          },
        });
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
  const runtime = new CopilotRuntime({
    agents: {
      // The bridge and runtime share AG-UI 0.0.57 at runtime, but pnpm's
      // peer-isolated declarations give AbstractAgent's private fields
      // separate TypeScript identities.
      default: new HistorianBridge({
        agent: remoteAgent,
        resourceId: "workshop-chat",
      }) as unknown as AbstractAgent,
    },
  });

  return createCopilotNodeListener({
    runtime,
    basePath: "/api/copilotkit",
    cors: false,
  });
};
