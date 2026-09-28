import {
  EventType,
  type BaseEvent,
  type ActivitySnapshotEvent,
  ToolCallStartEventSchema,
  ToolCallResultEventSchema,
} from "@ag-ui/core";
import {
  historianToolResultSchema,
  investigationActivityType,
  type InvestigationProgress,
} from "@packt-workshop/contracts";

// One tracker per subscription: progress follows actual tool events, never timers.
export function investigationProgressEvents() {
  const pending = new Set<string>();
  const snapshot = (
    id: string,
    content: InvestigationProgress,
  ): ActivitySnapshotEvent => ({
    type: EventType.ACTIVITY_SNAPSHOT,
    messageId: `historian-${id}`,
    activityType: investigationActivityType,
    content,
    replace: true,
  });
  return (event: BaseEvent): ActivitySnapshotEvent[] => {
    if (event.type === EventType.TOOL_CALL_START) {
      const start = ToolCallStartEventSchema.parse(event);
      if (start.toolCallName !== "query_historian") return [];
      pending.add(start.toolCallId);
      return [
        snapshot(start.toolCallId, {
          status: "running",
          message:
            "Investigating readings · generating and reviewing the query…",
        }),
      ];
    }
    if (event.type === EventType.TOOL_CALL_RESULT) {
      const result = ToolCallResultEventSchema.parse(event);
      if (!pending.delete(result.toolCallId)) return [];
      try {
        const parsed = historianToolResultSchema.parse(
          JSON.parse(result.content),
        );
        return [
          snapshot(
            result.toolCallId,
            parsed.status === "executed"
              ? {
                  status: "completed",
                  message: `Investigation complete · ${parsed.rowCount} readings returned`,
                }
              : {
                  status: "rejected",
                  message: `Query stopped · ${parsed.message}`,
                },
          ),
        ];
      } catch {
        return [
          snapshot(result.toolCallId, {
            status: "failed",
            message:
              "Investigation failed · no valid query result was received",
          }),
        ];
      }
    }
    if (
      event.type === EventType.RUN_ERROR ||
      event.type === EventType.RUN_FINISHED
    ) {
      const updates = [...pending].map((id) =>
        snapshot(id, {
          status: "failed",
          message: "Investigation ended without a query result",
        }),
      );
      pending.clear();
      return updates;
    }
    return [];
  };
}
