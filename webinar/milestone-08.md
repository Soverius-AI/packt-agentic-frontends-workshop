# Webinar 08 — Connect A2UI

**Start:** webinar-07. **Completed:** webinar-08.
**Recovery:** `pnpm webinar:select 08`; use 07 to rehearse.
**Worktree:** /Users/rainerh/programming/packt-webinar-02.

Chapter 7 selected records for a fixed grid. Chapter 8 can query aggregate datasets
and compose Table, Card and Text from the prepared catalog. The workflow, catalog,
components, renderer, schemas and backend implementation already exist.

## 1. Select the composition workflow and tool

In apps/agent-service/src/mastra/index.ts, replace the two imports:

```ts
import { createHistorianQueryWorkflow } from "./workflows/historian-composition/workflow";
import { createQueryHistorianTool } from "./agents/main/tools/query-composition-tool";
```

Keep the existing queryHistorian/queryHistorianTool creation, workflow registration,
agent argument and facility URL http://127.0.0.1:3101. The exported function names
are unchanged. The new workflow adds deterministic preflight, dataset results,
format selection and optional A2UI composition.

## 2. Select the prepared prompt

Copy the prepared webinar-08.ts from the presenter Code changes section into
apps/agent-service/src/mastra/prompts/webinar-08.ts when rehearsing from 07.
In apps/agent-service/src/mastra/agents/main/agent.ts:

```ts
import { CHAT_SYSTEM_PROMPT } from "../../prompts/webinar-08";
```

Keep query_historian and ToolCallFilter. The new prompt retains raise_alarm and the
existing frontend tools, allows aggregates, and passes complete layout requests
to the workflow. Do not use main-08: its tool names follow the original milestones.

## 3. Enable the prepared dataset backend

In apps/facility-service/src/main.ts, replace the HistorianQueryService import:

```ts
import { HistorianQueryService } from "./historian-query.js";
```

It currently comes from ./workshop.js, which exports the legacy fixed-reading
service. The new service implements /api/historian/validate and returns flexible
datasets from /api/historian/query, including aggregates. The existing constructor
and server wiring stay as they are. It uses the same facility database and keeps
read-only validation and execution limits. Do not reset the database.

## 4. Connect A2UI at the Copilot runtime

In apps/facility-service/src/create-copilot-runtime.ts, add:

```ts
import { HistorianBridge } from "./copilot-runtime.js";
```

Use the prepared bridge in place of new MastraAgent(...):

```ts
const mastraAgent: AbstractAgent = new HistorianBridge({
  agent: mastraClient.getAgent("default"),
});
```

Remove the now-unused createRequire import and the two declarations that load
MastraAgent. The prepared bridge owns that compatibility setup.

Add the A2UI option alongside agents:

```ts
const runtime = new CopilotRuntime({
  a2ui: { injectA2UITool: false },
  agents: { default: mastraAgent },
});
```

The workflow already generates the A2UI operations, so no additional model-facing
A2UI tool is needed. Runtime support delivers the operations as A2UI activity.
The prepared HistorianBridge removes previous A2UI activities and replaces prior
historian row payloads with a receipt before forwarding later requests to Mastra.
ToolCallFilter still controls the main model input inside Mastra. Show these as
prepared support; do not implement the bridge live.

## 5. Register the Angular catalog

In apps/angular-host/src/app/app.config.ts, add:

```ts
import { facilityWebCatalog } from "./a2ui/web-catalog";
```

Extend the existing provider:

```ts
provideCopilotKit({
  runtimeUrl: "/api/copilotkit",
  a2ui: { catalog: facilityWebCatalog },
});
```

Open the catalog to show its three existing components. The Angular host already
has CopilotA2UIActivityRenderer, result-store access and generated-view selection;
there is no app.ts or app.html change for this step. The model chooses component
structure and bindings; application code renders the components and supplies data.

## Restart and demonstrate

Restart pnpm dev:backend so its TypeScript is rebuilt. Angular and Mastra reload
source changes. Use a fresh Angular conversation after all services are ready.
Ports remain Angular 4200, backend 3101, Mastra API 4211 and Studio 4212.

1. “Show a table of the average air temperature for each room. Include only the
   room name and average temperature.”
2. “Show the latest ten air-temperature readings from the Cooling room in a
   table with only time, temperature and shift manager.”
3. “Show one card per room, with a table of its latest five air-temperature
   readings. Include time and temperature.”

Ask explicitly for tables or cards: the prepared format agent can return data
without generating a view for plain factual questions. Verify values against
returned data and inspect A2UI activity in the AG-UI extension. Show format
selection and composition in the Studio workflow trace. The composer receives
column metadata and the request, not the dataset's row values; application code
binds the real data to its layout.

[Speaker walkthrough](speaker-notes/08-a2ui.md).

## Accepted chat rendering

The generated widget is displayed in both chat and the main area. This behavior
is intentionally retained for this webinar; do not register the prepared
registerGeneratedViewNotice helper. Suppressing the chat widget is deferred.

## Recovery and verification

The completed presenter and selector cover chapters 01–08. Use
`pnpm webinar:select 08` to restore this implementation or 07 to rehearse.
Restart `pnpm dev:backend` after either selection so the correct historian service
and runtime are rebuilt. Stored facility data and Git branches are unchanged.

[Verification record](verification-08.md).
