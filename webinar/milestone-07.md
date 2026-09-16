# Webinar 07 — Historian connections to write live

**Start:** webinar-06. **Completed:** webinar-07.
**Recovery:** `pnpm webinar:select 07`; use 06 to rehearse.
**Worktree:** /Users/rainerh/programming/packt-webinar-02.

The workflow, generator/reviewer agents, tool adapter, backend SQL validation,
endpoint and Angular result grid are prepared. You connect three application files
and select the prepared webinar-07 prompt. Keep raise_alarm and the existing tools.

## 1. Register the workflow in Mastra index.ts

File: apps/agent-service/src/mastra/index.ts. Add:

```ts
import { createHistorianQueryWorkflow } from "./workflows/historian-query/workflow";
import { createQueryHistorianTool } from "./agents/main/tools/query-historian-tool";
```

Before new Mastra(...):

```ts
const queryHistorian = createHistorianQueryWorkflow(
  OPENROUTER_API_KEY,
  OPENROUTER_MODEL,
  "http://127.0.0.1:3101",
);
const queryHistorianTool = createQueryHistorianTool(queryHistorian);
```

Replace the agents property and add workflows; retain server, storage and observability:

```ts
agents: {
  default: createAgent(
    OPENROUTER_API_KEY,
    OPENROUTER_MODEL,
    queryHistorianTool,
  ),
},
workflows: { queryHistorian },
```

The workflow is registered in Studio. Its tool is created here and passed into
the agent. The third workflow argument is the facility URL, not the model provider.
The index and agent edits belong together: an intermediate type error while only
one has been updated is expected.

## 2. Attach the tool in agent.ts

File: apps/agent-service/src/mastra/agents/main/agent.ts. Add:

```ts
import { ToolCallFilter } from "@mastra/core/processors";
import { createTool } from "@mastra/core/tools";
```

Extend the existing function signature:

```ts
export function createAgent(
  apiKey: string,
  model: string,
  historianTool: ReturnType<typeof createTool>,
) {
```

In new Agent(...), replace tools: {} and add the input processor:

```ts
inputProcessors: [
  new ToolCallFilter({ exclude: ['query_historian'] }),
],
tools: {
  query_historian: historianTool,
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

Copy the prepared webinar-07.ts contents from the presenter Code changes section
when rehearsing from checkpoint 06. It preserves human approval and adds historian
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

The completed checkpoint includes the three application files and chapter-seven
prompt. Recover with `pnpm webinar:select 07`, or use 06 to rehearse. The selector
changes thirteen paths and preserves database state and Git branches.

[Verification record](verification-07.md).
