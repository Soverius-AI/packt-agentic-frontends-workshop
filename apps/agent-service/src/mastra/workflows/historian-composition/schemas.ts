import {
  historianToolResultSchema,
  historianQueryInputSchema,
  sqlReviewSchema,
  historianDatasetSchema,
  historianExecutionResultSchema,
  a2uiOperationsSchema,
} from "@packt-workshop/contracts";
import { z } from "zod";

export const queryHistorianInputSchema = historianQueryInputSchema;

export const generatedSqlSchema = historianQueryInputSchema
  .extend({
    sql: z.string().trim().min(1).max(12_000),
    explanation: z.string().trim().min(1).max(1_000),
  })
  .strict();

export const reviewedSqlSchema = generatedSqlSchema
  .extend({ review: sqlReviewSchema })
  .strict();

const executedResultSchema = historianToolResultSchema.options[0];
export const executedDataSchema = historianExecutionResultSchema.options[0];
export type ExecutedData = z.infer<typeof executedDataSchema>;
export const resultFormatSchema = z
  .object({ format: z.enum(["data", "ui"]) })
  .strict();
export const generateA2uiInputSchema = z
  .object({
    format: z.literal("ui"),
    result: executedDataSchema,
  })
  .strict();
export const returnDataInputSchema = z
  .object({
    format: z.literal("data"),
    result: executedDataSchema,
  })
  .strict();
export const selectedResultSchema = z.discriminatedUnion("format", [
  generateA2uiInputSchema,
  returnDataInputSchema,
]);
export type SelectedResult = z.infer<typeof selectedResultSchema>;
export const dataResultSchema = executedResultSchema.extend({
  kind: z.literal("data"),
  data: historianDatasetSchema,
});
export type DataResult = z.infer<typeof dataResultSchema>;

export const uiResultSchema = executedResultSchema.extend({
  kind: z.literal("ui"),
  a2ui_operations: a2uiOperationsSchema,
});
export type UiResult = z.infer<typeof uiResultSchema>;

export const errorResultSchema = historianToolResultSchema.and(
  z.object({ kind: z.literal("error"), message: z.string() }),
);
export type ErrorResult = z.infer<typeof errorResultSchema>;

export const a2uiGenerationOutputSchema = z.union([
  uiResultSchema,
  errorResultSchema,
]);

export const queryHistorianOutputSchema = z.union([
  dataResultSchema,
  uiResultSchema,
  errorResultSchema,
]);
export type QueryHistorianOutput = z.infer<typeof queryHistorianOutputSchema>;

export type QueryHistorianWorkflowInput = z.infer<
  typeof queryHistorianInputSchema
>;
export type ReviewedSql = z.infer<typeof reviewedSqlSchema>;
