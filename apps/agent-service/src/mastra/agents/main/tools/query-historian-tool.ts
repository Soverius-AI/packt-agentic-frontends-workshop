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
 * type QueryHistorianOutput = HistorianToolResult;
 *
 * type HistorianQueryWorkflow =
 *   ReturnType<typeof createHistorianQueryWorkflow>;
 */
type HistorianQueryWorkflow = ReturnType<typeof createHistorianQueryWorkflow>;

export function createQueryHistorianTool(workflow: HistorianQueryWorkflow) {
  return createTool({
    id: "query_historian",
    description:
      "Call once for the complete historian request. Copy the operator's entire message verbatim into question; never paraphrase or split it. This starts the historian-query workflow, which generates SQL, reviews it, and applies deterministic facility policy before execution.",
    inputSchema: queryHistorianInputSchema,
    outputSchema: queryHistorianOutputSchema,
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
