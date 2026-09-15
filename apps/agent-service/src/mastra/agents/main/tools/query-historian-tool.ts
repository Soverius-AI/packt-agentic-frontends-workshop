import { createTool } from "@mastra/core/tools";
import type { HistorianToolResult } from "@packt-workshop/contracts";
import type { createHistorianQueryWorkflow } from "../../../workflows/historian-query/workflow";
import {
  queryHistorianInputSchema,
  queryHistorianOutputSchema,
} from "../../../workflows/historian-query/schemas";

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
 *       question: string;
 *       sql: string;
 *       explanation: string;
 *       review: SqlReview;
 *       policyVersion: string;
 *       entries: FacilityReadingEntry[];
 *       rowCount: number;
 *       truncated: boolean;
 *       durationMs: number;
 *     }
 *   | {
 *       status: "rejected";
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
      "Call once for the complete historian request. Copy the operator's entire message verbatim into question; never paraphrase or split it. This starts the historian-query workflow, which generates SQL, reviews it, and applies deterministic facility policy before returning complete reading records for the existing grid.",
    inputSchema: queryHistorianInputSchema,
    outputSchema: queryHistorianOutputSchema,
    toModelOutput: (result) => ({
      type: "text",
      value:
        result.status === "rejected"
          ? `${result.message} Report this failure and stop. The user can send a new request to start a new run.`
          : result.rowCount === 0
            ? "No matching readings were found. The empty result is displayed."
            : `The query result is displayed in the Historian result view.${result.truncated ? " Only the first 200 readings are shown." : ""}`,
    }),
    execute: async (input, context): Promise<HistorianToolResult> => {
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
