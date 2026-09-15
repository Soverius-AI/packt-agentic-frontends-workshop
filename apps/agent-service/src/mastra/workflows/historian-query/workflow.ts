import { createWorkflow } from "@mastra/core/workflows";
import {
  queryHistorianInputSchema,
  queryHistorianOutputSchema,
} from "./schemas";
import { createHistorianSteps } from "./prepared-steps";

export function createHistorianQueryWorkflow(
  apiKey: string,
  model: string,
  facilityBaseUrl: string,
) {
  const { generateSql, reviewSql, validateAndExecute } = createHistorianSteps(
    apiKey,
    model,
    facilityBaseUrl,
  );
  return createWorkflow({
    id: "historian-query",
    description:
      "Call once with the operator's complete historian question. Generate one SQL proposal, review its meaning and fixed-grid result shape, then deterministically validate and execute it against the read-only facility historian.",
    inputSchema: queryHistorianInputSchema,
    outputSchema: queryHistorianOutputSchema,
  })
    .then(generateSql)
    .then(reviewSql)
    .then(validateAndExecute)
    .commit();
}
