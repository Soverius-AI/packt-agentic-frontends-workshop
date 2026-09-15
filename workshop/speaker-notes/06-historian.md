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
   `query_historian: createQueryHistorianTool(workflow)` to `tools`.
2. Open `tools/query-historian-tool.ts`: point to the input/output schemas and
   `workflow.createRun()` → `run.start()`. The tool adapter does not generate SQL.
3. Open `workflows/historian-query/workflow.ts`. Explain the three `.then(...)`
   connections in order. The steps are already prepared; show their composition
   without rewriting SQL execution infrastructure.
4. Open the two prepared prompts under `mastra/prompts/sql-generator.ts` and
   `sql-reviewer.ts`. Show the allowed view/columns and complete-reading result
   requirement. Long prompt text is copied or imported, never typed live.
5. In Angular's `workshop/connect.ts`, add `registerHistorianView(host)`. In
   `prepared-tools.ts`, show how `show_historian_readings` validates the response
   and opens the prepared Historian result view.
6. Restart Mastra and reload the browser/Studio. The historian workflow should
   now appear in Studio. The facility API was already prepared in the starter.

## Demonstrate

Ask: **Show me the maximum air temperature for each shift manager.**

Trace `query_historian` → generator → reviewer → deterministic validation/execution
→ `show_historian_readings`. Inspect the complete reading records in the result
view. Explain that a maximum can be represented by selecting the stored row that
contains it. Do not promise an exact row count or value before seeing the data.

Then: **Show me the average air temperature for each shift manager.**

Expected: an explicit unsupported/rejected result because computed summaries do
not fit this milestone's complete-reading grid. It must not pretend an average
is a stored reading. This motivates the later A2UI addition.

For the policy boundary, inspect `historian-query.ts` in the facility service:
the reviewer assesses meaning; deterministic policy and the read-only connection
enforce execution restrictions. This branch preserves milestone 07's sequence:
generate → review → validate-and-execute. Do not describe the unfinished 08 sequence.

## Recovery

Select 06, restart services and reload. On failure find the workflow step and
structured error. A model refusal, schema mismatch, validator rejection and HTTP
failure are distinct. Never weaken SQL restrictions to make a live demo pass.
