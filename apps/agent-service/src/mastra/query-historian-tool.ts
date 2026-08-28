import { createTool } from "@mastra/core/tools";
import type { HistorianToolResult, SqlReview } from "@packt-workshop/contracts";
import { z } from "zod";
import type { SqlReviewFunction } from "./sql-reviewer.js";

const POLICY_VERSION = "historian-v1";

// Mastra's workspace bundler currently cannot consume these newly exported
// runtime Zod values without creating a self-reexport. Keep the exact runtime
// shape local while the shared package remains the canonical public contract.
const queryHistorianInputSchema = z
  .object({
    sql: z.string().trim().min(1).max(12_000),
    explanation: z.string().trim().min(1).max(1_000),
  })
  .strict();
const sqlReviewOutputSchema = z
  .object({
    approved: z.boolean(),
    summary: z.string().trim().min(1).max(1_000),
    concerns: z.array(z.string().trim().min(1).max(500)).max(10),
  })
  .strict();
const historianScalarSchema = z.union([z.string(), z.number(), z.null()]);
const historianResultBaseSchema = z.object({
  sql: z.string(),
  explanation: z.string(),
  question: z.string(),
  review: sqlReviewOutputSchema,
  policyVersion: z.string(),
});
const historianResultSchema = z.discriminatedUnion("status", [
  historianResultBaseSchema
    .extend({
      status: z.literal("executed"),
      columns: z.array(z.string()).max(64),
      rows: z.array(z.array(historianScalarSchema).max(64)).max(200),
      rowCount: z.number().int().nonnegative().max(200),
      truncated: z.boolean(),
      durationMs: z.number().int().nonnegative(),
    })
    .strict(),
  historianResultBaseSchema
    .extend({
      status: z.literal("rejected"),
      stage: z.enum(["reviewer", "validator", "execution"]),
      code: z.string().min(1),
      message: z.string().min(1),
    })
    .strict(),
]);

type QueryHistorianToolOptions = {
  reviewSql: SqlReviewFunction;
  facilityBaseUrl?: string | undefined;
  fetch?: typeof globalThis.fetch | undefined;
};

function textFromContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return typeof part.text === "string" ? part.text : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

export function latestUserQuestion(messages: unknown[]): string {
  for (const message of messages.toReversed()) {
    if (
      message &&
      typeof message === "object" &&
      "role" in message &&
      message.role === "user" &&
      "content" in message
    ) {
      const text = textFromContent(message.content).trim();
      if (text) return text;
    }
  }
  return "The operator's current historian question.";
}

const rejectedResult = (
  input: { sql: string; explanation: string },
  question: string,
  review: SqlReview,
  code: string,
  message: string,
): HistorianToolResult => ({
  status: "rejected",
  stage: "reviewer",
  code,
  message,
  ...input,
  question,
  review,
  policyVersion: POLICY_VERSION,
});

export function createQueryHistorianTool(options: QueryHistorianToolOptions) {
  const request = options.fetch ?? globalThis.fetch;
  const facilityBaseUrl = options.facilityBaseUrl ?? "http://127.0.0.1:3001";

  return createTool({
    id: "query_historian",
    description:
      "Query the read-only facility historian with one SQLite SELECT or WITH statement. SQL is reviewed by a separate agent and then enforced by a deterministic policy before execution.",
    inputSchema: queryHistorianInputSchema,
    outputSchema: historianResultSchema,
    execute: async (input, context) => {
      const question = latestUserQuestion(context.agent?.messages ?? []);
      let review: SqlReview;
      try {
        review = await context.observe.span("review historian SQL", () =>
          options.reviewSql({ ...input, question }),
        );
      } catch (error) {
        return rejectedResult(
          input,
          question,
          {
            approved: false,
            summary: "The SQL reviewer could not produce a valid verdict.",
            concerns: [
              error instanceof Error ? error.message : "Unknown review error.",
            ],
          },
          "REVIEW_FAILED",
          "The historian query was not executed because review failed.",
        );
      }
      if (!review.approved) {
        return rejectedResult(
          input,
          question,
          review,
          "REVIEW_REJECTED",
          "The historian query was not executed because the reviewer rejected it.",
        );
      }

      return context.observe.span(
        "validate and execute historian SQL",
        async () => {
          const response = await request(
            `${facilityBaseUrl}/api/historian/query`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ ...input, question, review }),
              signal: context.abortSignal,
            },
          );
          if (!response.ok) {
            throw new Error(
              `Historian service rejected the request with HTTP ${response.status}.`,
            );
          }
          return historianResultSchema.parse(await response.json());
        },
      );
    },
  });
}
