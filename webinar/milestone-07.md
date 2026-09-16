# Webinar 07 — Historian connections to write live

**Working branch:** webinar-07, based on completed webinar-06.
**Status:** Preparation only; completed recovery snapshot pending.
**Worktree:** /Users/rainerh/programming/packt-webinar-02.

The workflow, generator/reviewer agents, tool adapter, backend SQL validation,
endpoint and Angular result grid are prepared. You connect three application files
and select the prepared webinar-07 prompt. Keep raise_alarm and the existing tools.

## 1. Register the workflow in Mastra index.ts

File: apps/agent-service/src/mastra/index.ts. Add:

```ts
import { createHistorianQueryWorkflow } from "./workflows/historian-query/workflow";
```

Before new Mastra(...):

```ts
const historianQueryWorkflow = createHistorianQueryWorkflow(
  OPENROUTER_API_KEY,
  OPENROUTER_MODEL,
  "http://127.0.0.1:3101",
);
```

Replace the agents property and add workflows; retain server, storage and observability:

```ts
agents: {
  default: createAgent(
    OPENROUTER_API_KEY,
    OPENROUTER_MODEL,
    historianQueryWorkflow,
  ),
},
workflows: { historianQueryWorkflow },
```

The same instance is registered in Studio and passed to the agent's tool.
The index and agent edits belong together: an intermediate type error while only
one has been updated is expected.

## 2. Attach the tool in agent.ts

File: apps/agent-service/src/mastra/agents/main/agent.ts. Add:

```ts
import { ToolCallFilter } from "@mastra/core/processors";
import type { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";
import { createQueryHistorianTool } from "./tools/query-historian-tool";
```

Extend the existing function signature:

```ts
export function createAgent(
  apiKey: string,
  model: string,
  historianQueryWorkflow: ReturnType<typeof createHistorianQueryWorkflow>,
) {
```

In new Agent(...), replace tools: {} and add the input processor:

```ts
inputProcessors: [
  new ToolCallFilter({ exclude: ['query_historian'] }),
],
tools: {
  query_historian: createQueryHistorianTool(historianQueryWorkflow),
},
```

The prepared tool accepts `{ question: string }`, creates a workflow run and
returns its typed result. Its toModelOutput maps the full result to a short receipt;
the filter prevents old historian calls/results from re-entering later model
requests. Angular still receives the complete result. It is not necessary to
register the frontend tools in Mastra's tools object.

## 3. Select the prepared prompt

In the same agent.ts, replace the prompt import:

```ts
import { CHAT_SYSTEM_PROMPT } from "../../prompts/webinar-07";
```

webinar-07.ts is already prepared. It preserves human approval and adds historian
instructions without claiming access to reactive frontend context. Original
main-06 and main-07 prompts are not the webinar prompts.

## 4. Connect Angular to the results

File: apps/angular-host/src/app/app.ts. In the existing CopilotKit imports,
replace `type injectAgentStore` with `injectAgentStore`.

Add this in the constructor:

```ts
this.resultStore.set(injectAgentStore("default"));
```

The existing computations read query_historian results and automatically select
the Historian result view. No new handler, template, app-config entry or
connectAgentContext call is needed.

## Demonstrate and verify

Wait for Angular/Mastra reload, then use a fresh Angular conversation:

1. “Show the latest ten air-temperature readings from the Cooling room.”
2. “Show the highest air-temperature reading for each shift manager.”
3. “What is the average air temperature in the Cooling room?” — explain the
   fixed-grid limitation; averages are reserved for A2UI.

Show the workflow and Angular request trace in Studio (4212), alongside the AG-UI
extension and the Historian result grid. Mastra is on 4211; backend is on 3101.
Do not reset the demo database just to connect this chapter.

[Speaker walkthrough](speaker-notes/07-historian.md).

Once the connections work, save the completed chapter and add recovery/presenter
snapshots. The branch currently contains preparation, not the completed chapter.
