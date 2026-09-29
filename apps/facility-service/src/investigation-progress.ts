import { EventType, type ActivitySnapshotEvent } from "@ag-ui/core";
import { MastraClient } from "@mastra/client-js";
import {
  historianProgressEventSchema,
  investigationActivityType,
} from "@packt-workshop/contracts";

type RemoteAgent = ReturnType<MastraClient["getAgent"]>;

export function workflowActivity(
  chunk: unknown,
): ActivitySnapshotEvent | undefined {
  const event = historianProgressEventSchema.safeParse(chunk);
  if (!event.success) return undefined;
  return {
    type: EventType.ACTIVITY_SNAPSHOT,
    messageId: `historian-${event.data.data.id}`,
    activityType: investigationActivityType,
    content: event.data.data.content,
    replace: true,
  };
}

// @ag-ui/mastra 1.1.0 ignores custom workflow data. Forward it alongside
// the bridge's normal chat/tool events, through the same remote stream.
export function withWorkflowActivities(
  agent: RemoteAgent,
  emit: (event: ActivitySnapshotEvent) => void,
): RemoteAgent {
  return new Proxy(agent, {
    get(target, property) {
      if (property === "stream") {
        return async (...args: Parameters<RemoteAgent["stream"]>) => {
          const response = await target.stream(...args);
          const process = response.processDataStream.bind(response);
          response.processDataStream = ({ onChunk }) =>
            process({
              onChunk: async (chunk) => {
                const activity = workflowActivity(chunk);
                if (activity) emit(activity);
                await onChunk(chunk);
              },
            });
          return response;
        };
      }
      const value = Reflect.get(target, property);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
