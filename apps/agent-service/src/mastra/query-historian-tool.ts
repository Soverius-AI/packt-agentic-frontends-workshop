import { createTool } from "@mastra/core/tools";
import type { HistorianToolResult } from "@packt-workshop/contracts";
import {
  type createHistorianQueryWorkflow,
  queryHistorianInputSchema,
  queryHistorianOutputSchema,
} from "./historian-workflow";

/**
 * Simplified TypeScript view of the tool boundary:
 *
 * type QueryHistorianInput = {
 *   question: string;
 * };
 *
 * type QueryHistorianOutput = HistorianToolResult;
 *
 * type QueryHistorianToolOptions = {
 *   workflow: ReturnType<typeof createHistorianQueryWorkflow>;
 * };
 */
type QueryHistorianToolOptions = {
  workflow: ReturnType<typeof createHistorianQueryWorkflow>;
};

export function createQueryHistorianTool(options: QueryHistorianToolOptions) {
  return createTool({
    id: "query_historian",
    description:
      "Call once for the complete historian request. Copy the operator's entire message verbatim into question; never paraphrase or split it. The workflow generates one SQL query, reviews it, and applies the deterministic facility policy before execution.",
    inputSchema: queryHistorianInputSchema,
    outputSchema: queryHistorianOutputSchema,
    execute: async (input, context): Promise<HistorianToolResult> => {
      const run = await options.workflow.createRun();
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
