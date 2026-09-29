import { createTool } from "@mastra/core/tools";
import {
  historianProgressEventSchema,
  type HistorianToolResult,
  type InvestigationProgress,
} from "@packt-workshop/contracts";
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
 *       stage: "preflight" | "reviewer" | "validator" | "execution";
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
      "Call once for the complete historian request. Copy the operator's entire message verbatim into question; never paraphrase or split it. This starts the historian-query workflow, which generates SQL, applies deterministic preflight, reviews it, and applies deterministic facility policy before returning readings or aggregates in the existing table columns.",
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
      const stream = run.stream({
        inputData: input,
        requestContext: context.requestContext,
      });

      let progress: InvestigationProgress["progress"] = 0;
      try {
        for await (const chunk of stream.fullStream) {
          const activity = historianProgressEventSchema.safeParse(chunk);
          if (activity.success) {
            progress = activity.data.data.content.progress;
            await context.writer?.custom(activity.data);
          }
        }
        const result = await stream.result;
        if (result.status !== "success") {
          if (result.status === "failed") throw result.error;
          throw new Error(`Historian workflow stopped with ${result.status}.`);
        }

        return queryHistorianOutputSchema.parse(result.result);
      } catch (error) {
        await context.writer?.custom({
          type: "data-historian-progress",
          data: {
            id: run.runId,
            content: {
              status: "failed",
              message: "Investigation failed",
              progress,
            },
          },
        });
        throw error;
      }
    },
  });
}
