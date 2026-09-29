import { setTimeout as delay } from "node:timers/promises";
import type { ToolStream } from "@mastra/core/tools";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import {
  HistorianPolicyError,
  validateHistorianStatement,
  type HistorianToolResult,
  type SqlReview,
  type InvestigationProgress,
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
  createJevSqlReviewFunction,
  type SqlReviewFunction,
} from "./agents/jev-sql-reviewer";

const POLICY_VERSION = "historian-v1";

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
    dependencies.reviewSql ?? createJevSqlReviewFunction(apiKey);

  return createWorkflow({
    id: "historian-query",
    description:
      "Call once with the operator's complete historian question. Generate one SQL proposal, preflight its statement policy, review its meaning and fixed-grid result shape, then deterministically validate and execute it against the read-only facility historian.",
    inputSchema: queryHistorianInputSchema,
    outputSchema: queryHistorianOutputSchema,
  })
    .then(createGenerateSqlStep(generateSqlProposal))
    .then(createDeterministicSqlCheck())
    .then(createAgenticSqlCheck(reviewSqlProposal))
    .then(createValidateAndExecuteStep(facilityBaseUrl, request))
    .commit();
}

function createGenerateSqlStep(generateSqlProposal: SqlGenerationFunction) {
  return createStep({
    id: "generate-sql",
    description:
      "Use the dedicated SQL generator agent to turn the operator question into one structured SQLite proposal.",
    inputSchema: queryHistorianInputSchema,
    outputSchema: generatedSqlSchema,
    execute: async ({ inputData, writer, runId }) => {
      await reportProgress(writer, runId, "Generating SQL…", 0);
      return {
        question: inputData.question,
        ...(await generateSqlProposal(inputData.question)),
      };
    },
  });
}

function createDeterministicSqlCheck() {
  return createStep({
    id: "preflight-sql",
    description:
      "Deterministically reject write operations and multiple statements before calling the SQL reviewer. This is an early check, not execution authorization.",
    inputSchema: generatedSqlSchema,
    outputSchema: generatedSqlSchema,
    execute: async ({ inputData, bail, writer, runId, abortSignal }) => {
      await reportProgress(
        writer,
        runId,
        "Checking SQL deterministically…",
        25,
      );
      // Presentation pause: keep this fast check visible for two seconds.
      await delay(2_000, undefined, { signal: abortSignal });
      try {
        validateHistorianStatement(inputData.sql);
        // Review and execute the exact proposal; do not rewrite it here.
        return inputData;
      } catch (error) {
        if (!(error instanceof HistorianPolicyError)) throw error;
        await reportProgress(
          writer,
          runId,
          "Query rejected by the deterministic check",
          25,
          "rejected",
        );
        return bail<HistorianToolResult>({
          ...inputData,
          status: "rejected",
          stage: "preflight",
          code: error.code,
          message: `SQL preflight rejected the proposal: ${error.message}`,
          review: {
            approved: false,
            concerns: [],
          },
          policyVersion: POLICY_VERSION,
        });
      }
    },
  });
}

function createAgenticSqlCheck(reviewSqlProposal: SqlReviewFunction) {
  return createStep({
    id: "review-sql",
    description:
      "Ask Jev about query safety, human intent, and stored reading columns.",
    inputSchema: generatedSqlSchema,
    outputSchema: reviewedSqlSchema,
    execute: async ({ inputData, writer, runId, abortSignal }) => {
      await reportProgress(writer, runId, "Reviewing SQL with Jev…", 50);
      // Presentation pause: keep the agentic review visible for two seconds.
      await delay(2_000, undefined, { signal: abortSignal });
      let review: SqlReview;
      try {
        review = await reviewSqlProposal(inputData);
      } catch (error) {
        review = {
          approved: false,
          concerns: [
            error instanceof Error ? error.message : "Unknown review error.",
          ],
        };
      }
      return { ...inputData, review };
    },
  });
}

function createValidateAndExecuteStep(
  facilityBaseUrl: string,
  request: typeof globalThis.fetch,
) {
  return createStep({
    id: "deterministic-validate-and-execute",
    description:
      "Apply the reviewer decision, then ask the facility-owned deterministic policy to validate and execute the exact SQL atomically.",
    inputSchema: reviewedSqlSchema,
    outputSchema: queryHistorianOutputSchema,
    execute: async ({ inputData, abortSignal, writer, runId }) => {
      if (!inputData.review.approved) {
        await reportProgress(
          writer,
          runId,
          "Query rejected by Jev",
          50,
          "rejected",
        );
        return reviewerRejection(inputData);
      }
      await reportProgress(
        writer,
        runId,
        "Validating and executing the query…",
        75,
      );

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
      const result = queryHistorianOutputSchema.parse(await response.json());
      await reportProgress(
        writer,
        runId,
        result.status === "executed"
          ? `Investigation complete · ${result.rowCount} readings returned`
          : `Query stopped · ${result.message}`,
        result.status === "executed" ? 100 : 75,
        result.status === "executed" ? "completed" : "rejected",
      );
      return result;
    },
  });
}

const reviewerRejection = (input: ReviewedSql): HistorianToolResult => ({
  status: "rejected",
  stage: "reviewer",
  code: "REVIEW_REJECTED",
  message:
    "The historian query was not executed because the reviewer rejected it.",
  ...input,
  policyVersion: POLICY_VERSION,
});

async function reportProgress(
  writer: ToolStream,
  runId: string,
  message: string,
  progress: InvestigationProgress["progress"],
  status: InvestigationProgress["status"] = "running",
): Promise<void> {
  await writer.custom({
    type: "data-historian-progress",
    data: { id: runId, content: { status, message, progress } },
  });
}
