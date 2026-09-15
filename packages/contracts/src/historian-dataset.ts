import { z } from "zod";

export const DATASET_ROW_LIMIT = 50_000;
export const datasetCellSchema = z.union([
  z.string().max(2_000),
  z.number().finite(),
  z.null(),
]);
export const datasetColumnSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
  label: z.string(),
  type: z.enum(["text", "number", "datetime"]),
});
export const datasetMetadataSchema = z.object({
  columns: z.array(datasetColumnSchema).min(1).max(24),
  rowCount: z.number().int().min(0).max(DATASET_ROW_LIMIT),
  createdAt: z.string(),
});
export const historianDatasetSchema = datasetMetadataSchema.extend({
  question: z.string(),
  sql: z.string(),
  rows: z.array(z.record(z.string(), datasetCellSchema)).max(DATASET_ROW_LIMIT),
});
export type DatasetMetadata = z.infer<typeof datasetMetadataSchema>;
export type HistorianDataset = z.infer<typeof historianDatasetSchema>;
export type DatasetColumn = z.infer<typeof datasetColumnSchema>;
export type DatasetRow = HistorianDataset["rows"][number];
