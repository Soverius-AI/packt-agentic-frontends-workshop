import { createResultDataModel } from "../steps/result-data-model";
import { assembleOps } from "@ag-ui/a2ui-toolkit";
import { randomUUID } from "node:crypto";
import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import {
  a2uiOperationsSchema,
  composeViewsSchema,
  composeViewsToolSchema,
  FACILITY_CATALOG_ID,
  validateResultComposition,
  validateTableFields,
  type HistorianDataset,
  type ResultComponent,
} from "@packt-workshop/contracts";

// Workflow-private, tool-free agent for the optional A2UI step.
export function createResultComposerAgent(apiKey: string, model: string) {
  const openrouter = createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  return new Agent({
    id: "result-composer",
    name: "Historian Result Composer",
    instructions: `Arrange Table, Card and Text to match the request and available columns. SQL has already filtered the dataset for this request. You do not receive row values: never invent names, descriptions, statistics or cell values.
For repeated cards, set the surface groupBy fields from outer to inner level, using name columns for readable labels. groupBy ONLY prepares data; it does not repeat components. An untitled root Card MUST repeat the first group with children:{componentId:"template-id",path:"groups"}. Repeat again for each nested grouping level. Each group provides dataset, label and groups. Bind group titles with {path:"label"}. Tables automatically use their group's dataset: do not guess room names or IDs. Bind stored text with {path:"dataset/rows/0/field_name"}.
An untitled Card is a plain container. Put ALL components in the flat components array; children contains IDs or ONE template object, never nested components. Use one top-level component per surface and unique IDs. Include only requested content. The application assigns the root ID.
To mix a Text introduction with repeated tables, use an untitled Card for the repetition. Give titles only to requested cards and tables. Example (adapt fields and omit unrequested content): {surfaces:[{groupBy:["outer_field","inner_field"],components:[{id:"root",component:"Card",children:{componentId:"outer",path:"groups"}},{id:"outer",component:"Card",title:{path:"label"},children:["intro","tables"]},{id:"intro",component:"Text",text:"Readings by room."},{id:"tables",component:"Card",children:{componentId:"table",path:"groups"}},{id:"table",component:"Table",title:{path:"label"}}]}]}`,
    model: openrouter(model),
  });
}

export async function composeResult(
  composer: ReturnType<typeof createResultComposerAgent>,
  dataset: HistorianDataset,
) {
  const { columns, question } = dataset;
  const abortSignal = AbortSignal.timeout(60_000);
  const result = await composer.generate(
    JSON.stringify({
      question,
      dataset: { columns },
    }),
    {
      abortSignal,
      maxSteps: 1,
      modelSettings: { temperature: 0, maxOutputTokens: 6_000 },
      structuredOutput: {
        schema: composeViewsToolSchema,
        // Preserve optional catalogue fields instead of OpenAI's strict-schema rewrite.
        jsonPromptInjection: true,
      },
    },
  );
  abortSignal.throwIfAborted();
  const surfaces = composeViewsSchema
    .parse(result.object)
    .surfaces.map(({ components, groupBy }) => ({
      components: withProtocolRoot(components),
      groupBy,
    }));
  for (const { components, groupBy } of surfaces) {
    validateTableFields(dataset, { groupBy });
    validateResultComposition(components);
    for (const component of components) {
      if (component.component === "Table")
        validateTableFields(dataset, component);
      const text =
        component.component === "Text" ? component.text : component.title;
      if (typeof text === "object" && text.path.startsWith("dataset/rows/0/"))
        validateTableFields(dataset, {
          columns: [{ field: text.path.slice("dataset/rows/0/".length) }],
        });
    }
  }
  return a2uiOperationsSchema.parse(
    surfaces.flatMap(({ components, groupBy }) =>
      assembleOps({
        intent: "create",
        surfaceId: randomUUID(),
        catalogId: FACILITY_CATALOG_ID,
        components: components.map((component) =>
          component.component === "Table"
            ? { ...component, dataset: { path: "dataset" } }
            : component,
        ),
        data: createResultDataModel(dataset, groupBy),
      }),
    ),
  );
}

// Component names are model choices; the A2UI root ID is a protocol detail.
function withProtocolRoot(components: ResultComponent[]): ResultComponent[] {
  const children = new Set(
    components.flatMap((component) =>
      component.component === "Card"
        ? Array.isArray(component.children)
          ? component.children
          : [component.children.componentId]
        : [],
    ),
  );
  const roots = components.filter((component) => !children.has(component.id));
  if (roots.length !== 1)
    throw new Error("Each surface must have exactly one top-level component.");
  const root = roots[0]!;
  if (root.id === "root") return components;
  if (components.some((component) => component.id === "root"))
    throw new Error("The root ID is reserved for the top-level component.");
  return components.map((component) =>
    component.id === root.id ? { ...component, id: "root" } : component,
  );
}
