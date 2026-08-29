import { createStep, createWorkflow } from "@mastra/core/workflows";
import type { HistorianToolResult, SqlReview } from "@packt-workshop/contracts";
import { z } from "zod";
import type { SqlGenerationFunction } from "./sql-generator";
import type { SqlReviewFunction } from "./sql-reviewer";

const POLICY_VERSION = "historian-v1";

export const queryHistorianInputSchema = z
  .object({
    question: z.string().trim().min(1).max(4_000),
  })
  .strict();

const sqlReviewOutputSchema = z
  .object({
    approved: z.boolean(),
    summary: z.string().trim().min(1).max(1_000),
    concerns: z.array(z.string().trim().min(1).max(500)).max(10),
  })
  .strict();

const generatedSqlSchema = queryHistorianInputSchema
  .extend({
    sql: z.string().trim().min(1).max(12_000),
    explanation: z.string().trim().min(1).max(1_000),
  })
  .strict();

const reviewedSqlSchema = generatedSqlSchema
  .extend({ review: sqlReviewOutputSchema })
  .strict();

const historianScalarSchema = z.union([z.string(), z.number(), z.null()]);
const queryHistorianOutputBaseSchema = generatedSqlSchema.extend({
  review: sqlReviewOutputSchema,
  policyVersion: z.string(),
});

export const queryHistorianOutputSchema = z.discriminatedUnion("status", [
  queryHistorianOutputBaseSchema
    .extend({
      status: z.literal("executed"),
      columns: z.array(z.string()).max(64),
      rows: z.array(z.array(historianScalarSchema).max(64)).max(200),
      rowCount: z.number().int().nonnegative().max(200),
      truncated: z.boolean(),
      durationMs: z.number().int().nonnegative(),
    })
    .strict(),
  queryHistorianOutputBaseSchema
    .extend({
      status: z.literal("rejected"),
      stage: z.enum(["reviewer", "validator", "execution"]),
      code: z.string().min(1),
      message: z.string().min(1),
    })
    .strict(),
]);

export type QueryHistorianWorkflowInput = z.infer<
  typeof queryHistorianInputSchema
>;

type HistorianWorkflowOptions = {
  generateSql: SqlGenerationFunction;
  reviewSql: SqlReviewFunction;
  facilityBaseUrl?: string | undefined;
  fetch?: typeof globalThis.fetch | undefined;
};

const reviewerRejection = (
  input: z.infer<typeof reviewedSqlSchema>,
): HistorianToolResult => ({
  status: "rejected",
  stage: "reviewer",
  code: "REVIEW_REJECTED",
  message:
    "The historian query was not executed because the reviewer rejected it.",
  ...input,
  policyVersion: POLICY_VERSION,
});

export function createHistorianQueryWorkflow(
  options: HistorianWorkflowOptions,
) {
  const request = options.fetch ?? globalThis.fetch;
  const facilityBaseUrl = options.facilityBaseUrl ?? "http://127.0.0.1:3001";

  const generateSql = createStep({
    id: "generate-sql",
    description:
      "Use the dedicated SQL generator agent to turn the operator question into one structured SQLite proposal.",
    inputSchema: queryHistorianInputSchema,
    outputSchema: generatedSqlSchema,
    execute: async ({ inputData }) => ({
      question: inputData.question,
      ...(await options.generateSql(inputData.question)),
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
        review = await options.reviewSql(inputData);
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
      "Generate, semantically review, deterministically validate, and execute one read-only historian query.",
    inputSchema: queryHistorianInputSchema,
    outputSchema: queryHistorianOutputSchema,
  })
    .then(generateSql)
    .then(reviewSql)
    .then(validateAndExecute)
    .commit();
}
