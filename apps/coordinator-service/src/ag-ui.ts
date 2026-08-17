import { randomUUID } from "node:crypto";
import {
  EventType,
  RunFinishedEventSchema,
  RunStartedEventSchema,
  StateSnapshotEventSchema,
  type AGUIEvent,
} from "@ag-ui/core";
import { assessmentRequestSchema } from "@packt-workshop/contracts";
import type { RequestHandler } from "express";
import type { WorkshopCoordinator } from "./coordinator.js";

const encode = (event: AGUIEvent): string =>
  `data: ${JSON.stringify(event)}\n\n`;

export function createAgUiHandler(
  coordinator: WorkshopCoordinator,
): RequestHandler {
  return async (request, response) => {
    response.status(200);
    response.setHeader("content-type", "text/event-stream");
    response.setHeader("cache-control", "no-cache");
    response.setHeader("connection", "keep-alive");
    response.flushHeaders();

    const runId = randomUUID();
    const threadId = request.body?.correlationId ?? randomUUID();
    response.write(
      encode(
        RunStartedEventSchema.parse({
          type: EventType.RUN_STARTED,
          threadId,
          runId,
        }),
      ),
    );

    try {
      const workflowRequest = assessmentRequestSchema.parse(request.body);
      const result = await coordinator.assess(workflowRequest);
      response.write(
        encode(
          StateSnapshotEventSchema.parse({
            type: EventType.STATE_SNAPSHOT,
            snapshot: result,
          }),
        ),
      );
      response.write(
        encode(
          RunFinishedEventSchema.parse({
            type: EventType.RUN_FINISHED,
            threadId,
            runId,
            result: { caseId: result.assessment.caseId },
          }),
        ),
      );
    } catch (error) {
      response.write(
        encode({
          type: EventType.RUN_ERROR,
          message:
            error instanceof Error ? error.message : "Coordinator run failed.",
          code: "WORKSHOP_COORDINATOR_ERROR",
        }),
      );
    } finally {
      response.end();
    }
  };
}
