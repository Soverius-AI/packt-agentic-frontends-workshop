import { z } from "zod";
import {
  composeResultToolSchema,
  FACILITY_CATALOG_ID,
} from "./facility-catalog.js";
import {
  historianDatasetSchema,
  type HistorianDataset,
} from "./historian-dataset.js";

const createSurfaceSchema = z.object({
  version: z.literal("v0.9"),
  createSurface: z.object({
    surfaceId: z.string().uuid(),
    catalogId: z.literal(FACILITY_CATALOG_ID),
  }),
});
const updateComponentsSchema = z.object({
  version: z.literal("v0.9"),
  updateComponents: z.object({
    surfaceId: z.string().uuid(),
    // The composer supplies layout; application code adds the data binding.
    components: z
      .array(z.record(z.string(), z.unknown()))
      .min(1)
      .max(16)
      .superRefine((components, context) => {
        const layout = components.map(({ dataset, ...component }) => {
          if (
            component.component === "Table" &&
            !z
              .object({ path: z.literal("dataset") })
              .strict()
              .safeParse(dataset).success
          ) {
            context.addIssue({
              code: "custom",
              message: "Tables must bind to the query data.",
            });
          }
          return component;
        });
        const parsed = composeResultToolSchema.safeParse({
          components: layout,
        });
        if (!parsed.success)
          context.addIssue({
            code: "custom",
            message: "Invalid component layout.",
          });
      }),
  }),
});
export type ResultDataModel = {
  dataset: HistorianDataset;
  label?: string | undefined;
  groups: ResultDataModel[];
};
const resultDataModelSchema: z.ZodType<ResultDataModel> = z.lazy(() =>
  z.object({
    dataset: historianDatasetSchema,
    label: z.string().optional(),
    groups: z.array(resultDataModelSchema),
  }),
);
const updateDataModelSchema = z.object({
  version: z.literal("v0.9"),
  updateDataModel: z.object({
    surfaceId: z.string().uuid(),
    path: z.literal("/").optional(),
    value: resultDataModelSchema,
  }),
});

export const a2uiOperationsSchema = z
  .array(
    z.union([
      createSurfaceSchema,
      updateComponentsSchema,
      updateDataModelSchema,
    ]),
  )
  .min(2)
  .max(24)
  .superRefine((operations, context) => {
    const surfaces = new Map<
      string,
      { components: boolean; needsData: boolean; data: boolean }
    >();
    for (const operation of operations) {
      if ("createSurface" in operation) {
        const id = operation.createSurface.surfaceId;
        if (surfaces.has(id))
          context.addIssue({
            code: "custom",
            message: "Surface IDs must be unique.",
          });
        surfaces.set(id, { components: false, needsData: false, data: false });
      } else {
        const update =
          "updateComponents" in operation
            ? operation.updateComponents
            : operation.updateDataModel;
        const surface = surfaces.get(update.surfaceId);
        if (!surface) {
          context.addIssue({
            code: "custom",
            message: "Create and update must refer to the same surface.",
          });
          continue;
        }
        if ("components" in update) {
          surface.components = true;
          surface.needsData = update.components.some(
            (component) => component.component === "Table",
          );
        } else surface.data = true;
      }
    }
    if (
      [...surfaces.values()].some(
        (surface) =>
          !surface.components || (surface.needsData && !surface.data),
      )
    )
      context.addIssue({
        code: "custom",
        message:
          "Each surface needs components and each table needs query data.",
      });
  });
