# 06 — Connect a reviewed historian workflow

**Start:** completed 05. **Completed code:** [solution 06](../solutions/06/).

**Demo inputs:** Follow the numbered prompts for milestone 06 in the
[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts
in the Presenter desk. Each includes setup, expected results and what to show.

## Say

“The agent gets one narrow question tool. A workflow generates a SQL proposal,
reviews its meaning, and asks the facility service to validate and execute it.
The result still has to fit our prepared reading table.”

## Open and change

1. `apps/agent-service/src/mastra/agents/main/agent.ts`: select `main-06`, set
   `historianEnabled = true`, import `createQueryHistorianTool`, and add
   `query_historian: createQueryHistorianTool(workflow)` to `tools`. Import
   `ToolCallFilter` and add the prepared `inputProcessors` line from solution 06
   so previous historian results stay out of later model requests.
2. Open `tools/query-historian-tool.ts`: point to the input/output schemas and
   `workflow.createRun()` → `run.start()`. The tool adapter does not generate SQL.
3. Open `workflows/historian-query/workflow.ts`. Explain the three `.then(...)`
   connections in order. The steps are already prepared; show their composition
   without rewriting SQL execution infrastructure.
4. Open the two prepared prompts under `mastra/prompts/sql-generator.ts` and
   `sql-reviewer.ts`. Show the allowed view/columns and complete-reading result
   requirement. Long prompt text is copied or imported, never typed live.
5. No Angular edit is needed. Open the prepared `historianResult` computed value
   in `apps/angular-host/src/app/app.ts`: it reads validated tool results from
   the agent store. `toModelOutput` in the backend tool gives the model only a
   completion message. The bridge removes old query payloads from replayed history.
   Explain why neither a second display tool nor model copying is needed.
6. Wait for Mastra to reload automatically, then refresh the app and Studio. The historian workflow should
   now appear in Studio. The facility API was already prepared in the starter.

## Demonstrate

Ask: **Show me the maximum air temperature for each shift manager.**

Trace `query_historian` → generator → reviewer → deterministic validation/execution
→ delivered tool result → the prepared grid. Inspect the complete reading records in the result
view. Explain that a maximum can be represented by selecting the stored row that
contains it. Do not promise an exact row count or value before seeing the data.

Then: **Show me the average air temperature for each shift manager.**

Expected: an explicit unsupported/rejected result because computed summaries do
not fit this milestone's complete-reading grid. It must not pretend an average
is a stored reading. This motivates the later A2UI addition.

For the policy boundary, inspect `historian-query-legacy.ts` in the facility service:
the reviewer assesses meaning; deterministic policy and the read-only connection
enforce execution restrictions. This branch preserves milestone 07's sequence:
generate → review → validate-and-execute. Milestone 08 adds a separate workflow
with an earlier deterministic check and a data/UI branch; teach that when it is connected.

## Recovery

Select 06, wait for Mastra to reload, then refresh the app and Studio. Restart
the backend launcher only if its presenter file changed. On failure find the workflow step and
structured error. A model refusal, schema mismatch, validator rejection and HTTP
failure are distinct. Never weaken SQL restrictions to make a live demo pass.
