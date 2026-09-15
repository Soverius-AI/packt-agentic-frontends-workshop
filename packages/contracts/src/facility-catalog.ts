// CopilotKit 1.69's catalogue factory consumes Zod 3 definitions.
// The application data contracts continue to use Zod 4.
import { validateA2UIComponents } from "@ag-ui/a2ui-toolkit";
import type { HistorianDataset } from "./historian-dataset.js";
import { z } from "zod3";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z as z4 } from "zod";

export const FACILITY_CATALOG_ID = "https://soverius.ai/a2ui/facility-v1";
const field = z.string().regex(/^[a-z][a-z0-9_]{0,63}$/);
// Native A2UI bindings: values are resolved in the browser's current data context.
const boundTextSchema = z.union([
  z.string().max(1200),
  z
    .object({
      path: z
        .string()
        .regex(/^(label|dataset\/rows\/0\/[a-z][a-z0-9_]{0,63})$/),
    })
    .strict(),
]);
const childListSchema = z.union([
  z.array(z.string()).min(1).max(12),
  z.object({ componentId: z.string(), path: z.literal("groups") }).strict(),
]);
export const resultColumnSchema = z
  .object({
    field,
    label: z.string().min(1).max(80).optional(),
    digits: z.number().int().min(0).max(6).optional(),
  })
  .strict();
export const resultAggregateSchema = z
  .object({
    label: z.string().min(1).max(80),
    operation: z.enum(["average", "minimum", "maximum", "sum", "count"]),
    field: field.optional(),
    equals: z.union([z.string().max(100), z.number(), z.null()]).optional(),
  })
  .strict();
export const resultTablePropsSchema = z
  .object({
    title: boundTextSchema.optional(),
    columns: z
      .array(resultColumnSchema)
      .min(1)
      .max(24)
      .optional()
      .describe(
        "Visible detail columns, in order. Omit to use the available reading columns.",
      ),
    groupBy: z
      .array(field)
      .max(3)
      .optional()
      .describe("Grouping hierarchy. Omit for an ungrouped table."),
    aggregates: z
      .array(resultAggregateSchema)
      .max(8)
      .optional()
      .describe(
        "Summary columns computed over ALL matching rows, before paging.",
      ),
    showDetails: z
      .boolean()
      .optional()
      .describe("Whether grouped summaries can expand to individual readings."),
    expanded: z.boolean().optional(),
    groupOrder: z.enum(["label", "count-desc"]).optional(),
  })
  .strict();
export const facilityCatalogDefinitions = {
  Card: {
    description:
      "A card containing Text, Table, or nested Card children. Without a title it is a plain layout container. Children can repeat a template over groups.",
    props: z
      .object({
        title: boundTextSchema.optional(),
        children: childListSchema,
      })
      .strict(),
  },
  Table: {
    description:
      "A dynamic table of real dataset values. Choose and order columns, and optionally group or aggregate the rows. Never provide invented cells.",
    // A2UI resolves this binding before passing the query data to the renderer.
    props: resultTablePropsSchema.extend({
      dataset: z.union([
        z.object({ path: z.string() }),
        z.custom<HistorianDataset>(),
      ]),
    }),
  },
  Text: {
    description:
      "Plain text or a binding to a returned text field. Never invent facts about unseen rows.",
    props: z.object({ text: boundTextSchema }).strict(),
  },
};
export type ResultColumn = z.infer<typeof resultColumnSchema>;
export type ResultAggregate = z.infer<typeof resultAggregateSchema>;
export type ResultTableProps = z.infer<typeof resultTablePropsSchema>;

const componentSchema = z.discriminatedUnion("component", [
  facilityCatalogDefinitions.Card.props.extend({
    id: z.string().min(1).max(80),
    component: z.literal("Card"),
  }),
  resultTablePropsSchema.extend({
    id: z.string().min(1).max(80),
    component: z.literal("Table"),
  }),
  facilityCatalogDefinitions.Text.props.extend({
    id: z.string().min(1).max(80),
    component: z.literal("Text"),
  }),
]);
export const composeResultSchema: z.ZodType<{
  components: z.infer<typeof componentSchema>[];
  groupBy?: string[] | undefined;
}> = z
  .object({
    components: z.array(componentSchema).min(1).max(16),
    groupBy: z
      .array(field)
      .max(3)
      .optional()
      .describe(
        "Group query rows for repeated cards, from outer to inner level. The renderer receives groups with label, dataset and nested groups.",
      ),
  })
  .strict();
export type ResultComponent = z.infer<typeof componentSchema>;
// Preserve the complete public contract across the Zod 3 catalogue / Zod 4
// Mastra boundary without asking TypeScript to expand both libraries' types.
// pnpm resolves this converter's Zod 3 type through zod/v3, while the
// renderer resolves it through zod3. Both use the same Zod 3 runtime format.
export const composeResultJsonSchema = zodToJsonSchema(
  composeResultSchema as unknown as Parameters<typeof zodToJsonSchema>[0],
  { $refStrategy: "none" },
);
export const composeResultToolSchema = z4.fromJSONSchema(
  composeResultJsonSchema as Parameters<typeof z4.fromJSONSchema>[0],
) as z4.ZodType<{ components: ResultComponent[]; groupBy?: string[] }>;

export function validateResultComposition(components: ResultComponent[]): void {
  const validation = validateA2UIComponents({
    components,
    validateBindings: false,
  });
  if (!validation.valid)
    throw new Error(validation.errors.map((error) => error.message).join(" "));
  const nodes = new Map(
    components.map((component) => [component.id, component]),
  );
  const visited = new Set<string>();
  const visit = (id: string, ancestors: string[]) => {
    const node = nodes.get(id)!;
    if (ancestors.length > 5)
      throw new Error("The composition is nested too deeply.");
    visited.add(id);
    if (node.component === "Card")
      for (const child of Array.isArray(node.children)
        ? node.children
        : [node.children.componentId])
        visit(child, [...ancestors, id]);
  };
  visit("root", []);
  if (visited.size !== nodes.size)
    throw new Error("Every component must be reachable from root.");
}

// Each top-level card or standalone table has its own A2UI surface.
export const composeViewsSchema = z
  .object({ surfaces: z.array(composeResultSchema).min(1).max(8) })
  .strict();
export const composeViewsJsonSchema = zodToJsonSchema(
  composeViewsSchema as unknown as Parameters<typeof zodToJsonSchema>[0],
  { $refStrategy: "none" },
);
export const composeViewsToolSchema = z4.fromJSONSchema(
  composeViewsJsonSchema as Parameters<typeof z4.fromJSONSchema>[0],
) as z4.ZodType<z.infer<typeof composeViewsSchema>>;
