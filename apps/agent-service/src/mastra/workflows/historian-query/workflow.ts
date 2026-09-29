import { createStep, createWorkflow } from "@mastra/core/workflows";
import {
  HistorianPolicyError,
  validateHistorianStatement,
  type HistorianToolResult,
  type SqlReview,
} from "@packt-workshop/contracts";
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
  type SqlGenerationFunction,
} from "./agents/sql-generator-agent";
import {
  createSqlReviewerAgent,
  createSqlReviewFunction,
  type SqlReviewFunction,
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

export function createHistorianQueryWorkflow(
  apiKey: string,
  model: string,
  facilityBaseUrl: string,
  dependencies: {
    generateSql?: SqlGenerationFunction;
    reviewSql?: SqlReviewFunction;
    request?: typeof globalThis.fetch;
  } = {},
) {
  const request = dependencies.request ?? globalThis.fetch;
  const generateSqlProposal =
    dependencies.generateSql ??
    createSqlGenerationFunction(createSqlGeneratorAgent(apiKey, model));
  const reviewSqlProposal =
    dependencies.reviewSql ??
    createSqlReviewFunction(createSqlReviewerAgent(apiKey, model));

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

  const preflightSql = createStep({
    id: "preflight-sql",
    description:
      "Deterministically reject write operations and multiple statements before calling the SQL reviewer. This is an early check, not execution authorization.",
    inputSchema: generatedSqlSchema,
    outputSchema: generatedSqlSchema,
    execute: async ({ inputData, bail }) => {
      try {
        validateHistorianStatement(inputData.sql);
        // Review and execute the exact proposal; do not rewrite it here.
        return inputData;
      } catch (error) {
        if (!(error instanceof HistorianPolicyError)) throw error;
        return bail<HistorianToolResult>({
          ...inputData,
          status: "rejected",
          stage: "preflight",
          code: error.code,
          message: `SQL preflight rejected the proposal: ${error.message}`,
          review: {
            approved: false,
            summary:
              "SQL review was not run because deterministic preflight rejected the proposal.",
            concerns: [],
          },
          policyVersion: POLICY_VERSION,
        });
      }
    },
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

  return createWorkflow({
    id: "historian-query",
    description:
      "Call once with the operator's complete historian question. Generate one SQL proposal, preflight its statement policy, review its meaning and fixed-grid result shape, then deterministically validate and execute it against the read-only facility historian.",
    inputSchema: queryHistorianInputSchema,
    outputSchema: queryHistorianOutputSchema,
  })
    .then(generateSql)
    .then(preflightSql)
    .then(reviewSql)
    .then(validateAndExecute)
    .commit();
}
