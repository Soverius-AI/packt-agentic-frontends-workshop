import { createTool } from "@mastra/core/tools";
import type { createHistorianQueryWorkflow } from "../../../workflows/historian-composition/workflow";
import {
  queryHistorianInputSchema,
  queryHistorianOutputSchema,
  type QueryHistorianOutput,
} from "../../../workflows/historian-composition/schemas";

/**
 * Simplified TypeScript view of this boundary:
 *
 * type QueryHistorianInput = {
 *   question: string;
 * };
 *
 * type QueryHistorianOutput =
 *   | {
 *       status: "executed";
 *       // kind: "data" adds data: HistorianDataset.
 *       // kind: "ui" adds a2ui_operations: A2UIOperation[].
 *       // kind: "error" adds message if preparing the result failed.
 *       question: string;
 *       sql: string;
 *       explanation: string;
 *       review: SqlReview;
 *       policyVersion: string;
 *       entries: FacilityReadingEntry[]; // Empty for A2UI datasets.
 *       dataset?: DatasetMetadata;
 *       rowCount: number;
 *       truncated: boolean;
 *       durationMs: number;
 *     }
 *   | {
 *       status: "rejected";
 *       kind: "error";
 *       question: string;
 *       sql: string;
 *       explanation: string;
 *       review: SqlReview;
 *       policyVersion: string;
 *       stage: "reviewer" | "validator" | "execution";
 *       code: string;
 *       message: string;
 *     };
 *
 * type HistorianQueryWorkflow =
 *   ReturnType<typeof createHistorianQueryWorkflow>;
 */
type HistorianQueryWorkflow = ReturnType<typeof createHistorianQueryWorkflow>;

export function createQueryHistorianTool(workflow: HistorianQueryWorkflow) {
  return createTool({
    id: "query_historian",
    description:
      "Run the reviewed historian workflow once for the complete question, including any requested presentation. Returns kind=data with query rows, kind=ui with an automatically displayed A2UI view, or kind=error. The workflow chooses the format; no second display call is needed.",
    inputSchema: queryHistorianInputSchema,
    outputSchema: queryHistorianOutputSchema,
    toModelOutput: (result) => {
      if (result.kind === "error")
        return {
          type: "text",
          value: `${result.message} Report this failure and stop. Tell the user they can send a new request to start a new run.`,
        };
      if (result.kind === "ui")
        return {
          type: "text",
          value: "The requested view is displayed. Acknowledge it briefly.",
        };
      return {
        type: "text",
        value:
          "The query completed. The application received the data. Acknowledge completion without describing values you have not seen.",
      };
    },
    execute: async (input, context): Promise<QueryHistorianOutput> => {
      const run = await workflow.createRun();
      const result = await run.start({
        inputData: input,
        requestContext: context.requestContext,
      });

      if (result.status !== "success") {
        if (result.status === "failed") throw result.error;
        throw new Error(`Historian workflow stopped with ${result.status}.`);
      }

      return queryHistorianOutputSchema.parse(result.result);
    },
  });
}
