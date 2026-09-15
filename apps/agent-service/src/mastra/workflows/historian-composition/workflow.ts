import { createStep, createWorkflow, type Step } from "@mastra/core/workflows";
import type { SqlReview } from "@packt-workshop/contracts";
import {
  generatedSqlSchema,
  queryHistorianInputSchema,
  queryHistorianOutputSchema,
  reviewedSqlSchema,
  executedDataSchema,
  type QueryHistorianOutput,
  selectedResultSchema,
  generateA2uiInputSchema,
  returnDataInputSchema,
  dataResultSchema,
  a2uiGenerationOutputSchema,
  type SelectedResult,
  type DataResult,
  type UiResult,
  type ErrorResult,
} from "./schemas";
import {
  createSqlGenerationFunction,
  createSqlGeneratorAgent,
} from "./agents/sql-generator-agent";
import {
  createSqlReviewerAgent,
  createSqlReviewFunction,
} from "./agents/sql-reviewer-agent";

import {
  createResultFormatAgent,
  createResultFormatFunction,
} from "./agents/result-format-agent";
import { createResultComposerAgent } from "./agents/result-composer-agent";
import { createSqlCheckFunction } from "./steps/check-sql";
import { createHistorianExecutionFunction } from "./steps/execute-query";
import { createA2uiGenerationFunction } from "./steps/generate-a2ui";

export function createHistorianQueryWorkflow(
  apiKey: string,
  model: string,
  facilityBaseUrl: string,
) {
  const composer = createResultComposerAgent(apiKey, model);
  const checkSql = createSqlCheckFunction(facilityBaseUrl);
  const executeQuery = createHistorianExecutionFunction(facilityBaseUrl);
  const generateUi = createA2uiGenerationFunction(composer);
  const selectFormat = createResultFormatFunction(
    createResultFormatAgent(apiKey, model),
  );
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

  const deterministicCheck = createStep({
    id: "check-sql",
    description:
      "Check SQL against fixed facility rules before the model reviews it. Do not execute the query.",
    inputSchema: generatedSqlSchema,
    outputSchema: generatedSqlSchema,
    execute: async ({ inputData, abortSignal, bail }) => {
      const check = await checkSql(inputData.sql, abortSignal);
      if (!check.approved)
        return bail<QueryHistorianOutput>({
          ...inputData,
          status: "rejected",
          kind: "error",
          stage: "validator",
          code: check.code,
          message: check.message,
          policyVersion: check.policyVersion,
          review: {
            approved: false,
            summary:
              "Model review was not run because the deterministic check failed.",
            concerns: [],
          },
        });
      return inputData;
    },
  });

  const reviewSql = createStep({
    id: "review-sql",
    description:
      "Ask the separate reviewer agent whether the generated SQL answers the original question.",
    inputSchema: generatedSqlSchema,
    outputSchema: reviewedSqlSchema,
    execute: async ({ inputData, bail }) => {
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
      if (!review.approved)
        return bail<QueryHistorianOutput>({
          ...inputData,
          review,
          status: "rejected",
          kind: "error",
          stage: "reviewer",
          code: "REVIEW_REJECTED",
          message:
            "The historian query was not executed because the reviewer rejected it.",
          policyVersion: "historian-v2",
        });
      return { ...inputData, review };
    },
  });

  const executeSql = createStep({
    id: "execute-sql",
    description:
      "Execute the approved SQL and receive its data in the same backend response.",
    inputSchema: reviewedSqlSchema,
    outputSchema: executedDataSchema,
    execute: async ({ inputData, abortSignal, bail }) => {
      const result = await executeQuery(inputData, abortSignal);
      if (result.status === "rejected")
        return bail<QueryHistorianOutput>({ ...result, kind: "error" });
      return result;
    },
  });

  const selectResultFormat = createStep({
    id: "select-result-format",
    description:
      "Decide inside the workflow whether the operator's request needs an A2UI view or a data answer.",
    inputSchema: executedDataSchema,
    outputSchema: selectedResultSchema,
    execute: async ({ inputData, bail }) => {
      try {
        return { result: inputData, ...(await selectFormat(inputData)) };
      } catch (error) {
        const { data, ...result } = inputData;
        return bail<QueryHistorianOutput>({
          ...result,
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not decide the result format.",
        });
      }
    },
  });

  const generateA2ui = createStep({
    id: "generate-a2ui",
    description:
      "Call the result-composer agent and validate its A2UI composition using the executed query data.",
    inputSchema: generateA2uiInputSchema,
    outputSchema: a2uiGenerationOutputSchema,
    execute: async ({ inputData }) => generateUi(inputData.result),
  });

  const returnData = createStep({
    id: "return-data",
    description: "Return the query data without calling the A2UI agent.",
    inputSchema: returnDataInputSchema,
    outputSchema: dataResultSchema,
    execute: async ({ inputData }) => ({
      ...inputData.result,
      kind: "data" as const,
    }),
  });

  return createWorkflow({
    id: "historian-query",
    description:
      "Call once with the operator's complete historian question. Generate SQL, check it deterministically, review it with a model, and execute it. Then decide inside the workflow whether to return data or call the A2UI agent.",
    inputSchema: queryHistorianInputSchema,
    outputSchema: queryHistorianOutputSchema,
  })
    .then(generateSql)
    .then(deterministicCheck)
    .then(reviewSql)
    .then(executeSql)
    .then(selectResultFormat)
    .branch([
      // Mastra does not narrow branch inputs from predicates. Validate each
      // branch's input before adapting its type to Mastra's union signature.
      [
        async ({ inputData }) =>
          generateA2uiInputSchema.safeParse(inputData).success,
        generateA2ui as Step<
          "generate-a2ui",
          unknown,
          SelectedResult,
          UiResult | ErrorResult
        >,
      ],
      [
        async ({ inputData }) =>
          returnDataInputSchema.safeParse(inputData).success,
        returnData as Step<"return-data", unknown, SelectedResult, DataResult>,
      ],
    ])
    .map(async ({ inputData }) =>
      queryHistorianOutputSchema.parse(
        inputData["generate-a2ui"] ?? inputData["return-data"],
      ),
    )
    .commit();
}
