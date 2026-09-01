import {
  historianToolResultSchema,
  historianQueryInputSchema,
  sqlReviewSchema,
} from "@packt-workshop/contracts";
import { z } from "zod";

export const queryHistorianInputSchema = historianQueryInputSchema;

export const generatedSqlSchema = queryHistorianInputSchema
  .extend({
    sql: z.string().trim().min(1).max(12_000),
    explanation: z.string().trim().min(1).max(1_000),
  })
  .strict();

export const reviewedSqlSchema = generatedSqlSchema
  .extend({ review: sqlReviewSchema })
  .strict();

export const queryHistorianOutputSchema = historianToolResultSchema;

export type QueryHistorianWorkflowInput = z.infer<
  typeof queryHistorianInputSchema
>;
export type ReviewedSql = z.infer<typeof reviewedSqlSchema>;
