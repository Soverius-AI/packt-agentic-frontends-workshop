import { createStep } from "@mastra/core/workflows";
import type { HistorianToolResult, SqlReview } from "@packt-workshop/contracts";
import {
  generatedSqlSchema,
  queryHistorianInputSchema,
  queryHistorianOutputSchema,
  reviewedSqlSchema,
  type ReviewedSql,
} from "./schemas";
import {
  createSqlGenerationFunction,
  createSqlGeneratorAgent,
} from "./agents/sql-generator-agent";
import {
  createSqlReviewerAgent,
  createSqlReviewFunction,
} from "./agents/sql-reviewer-agent";

const POLICY_VERSION = "historian-v1";

const reviewerRejection = (input: ReviewedSql): HistorianToolResult => ({
  status: "rejected",
  stage: "reviewer",
  code: "REVIEW_REJECTED",
  message:
    "The historian query was not executed because the reviewer rejected it.",
  ...input,
  policyVersion: POLICY_VERSION,
});

export function createHistorianSteps(
  apiKey: string,
  model: string,
  facilityBaseUrl: string,
) {
  const request = globalThis.fetch;
  const generateSqlProposal = createSqlGenerationFunction(
    createSqlGeneratorAgent(apiKey, model),
  );
  const reviewSqlProposal = createSqlReviewFunction(
    createSqlReviewerAgent(apiKey, model),
  );

  const generateSql = createStep({
    id: "generate-sql",
    description:
      "Use the dedicated SQL generator agent to turn the operator question into one structured SQLite proposal.",
    inputSchema: queryHistorianInputSchema,
    outputSchema: generatedSqlSchema,
    execute: async ({ inputData }) => ({
      question: inputData.question,
      ...(await generateSqlProposal(inputData.question)),
    }),
  });

  const reviewSql = createStep({
    id: "review-sql",
    description:
      "Ask the separate reviewer agent whether the generated SQL answers the original question.",
    inputSchema: generatedSqlSchema,
    outputSchema: reviewedSqlSchema,
    execute: async ({ inputData }) => {
      let review: SqlReview;
      try {
        review = await reviewSqlProposal(inputData);
      } catch (error) {
        review = {
          approved: false,
          summary: "The SQL reviewer could not produce a valid verdict.",
          concerns: [
            error instanceof Error ? error.message : "Unknown review error.",
          ],
        };
      }
      return { ...inputData, review };
    },
  });

  const validateAndExecute = createStep({
    id: "deterministic-validate-and-execute",
    description:
      "Apply the reviewer decision, then ask the facility-owned deterministic policy to validate and execute the exact SQL atomically.",
    inputSchema: reviewedSqlSchema,
    outputSchema: queryHistorianOutputSchema,
    execute: async ({ inputData, abortSignal }) => {
      if (!inputData.review.approved) return reviewerRejection(inputData);

      const response = await request(`${facilityBaseUrl}/api/historian/query`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(inputData),
        ...(abortSignal ? { signal: abortSignal } : {}),
      });
      if (!response.ok) {
        throw new Error(
          `Historian service rejected the request with HTTP ${response.status}.`,
        );
      }
      return queryHistorianOutputSchema.parse(await response.json());
    },
  });

  return { generateSql, reviewSql, validateAndExecute };
}
