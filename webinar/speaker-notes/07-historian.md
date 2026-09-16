# 07 — Query the historian through a backend tool

**Status:** Completed chapter, with saved code and recovery snapshot.
**Start branch:** `webinar-06`. **Completed branch:** `webinar-07`.
**Completed checkpoint:** `git switch webinar-07`. Rehearse from `webinar-06`.
**Worktree:** /Users/rainerh/programming/packt-webinar-02.
**Ports:** Angular 4200, facility backend 3101, Mastra API 4211, Studio 4212, notes 4400.
Original milestone 6 is taught here, after human approval. Keep all frontend tools
and raise_alarm. No reactive frontend context is introduced.

## Say

“Frontend tools let the assistant operate our interface. A backend tool can now
answer questions about stored measurements. The assistant passes a question to a
workflow: generate SQL, review its meaning, validate and execute it.”

“The model reviewer checks whether the query makes sense. The backend's ordinary
code decides what is permitted to execute. Reviewer approval is not permission.”

## Open and change

1. Open apps/agent-service/src/mastra/workflows/historian-query/workflow.ts.
   Show the prepared .then(generateSql), .then(reviewSql), .then(validateAndExecute)
   chain. Open prepared-steps.ts and the generator/reviewer agents to explain
   their responsibilities. The schema, prompts, steps and workflow are already
   written; reuse them rather than reimplementing them live.
2. In Mastra index.ts, import createHistorianQueryWorkflow and createQueryHistorianTool.
   Create queryHistorian with OPENROUTER_API_KEY, OPENROUTER_MODEL and
   http://127.0.0.1:3101. This third argument is the facility backend, not OpenRouter.
   Then create queryHistorianTool = createQueryHistorianTool(queryHistorian).
   Register workflows: { queryHistorian } and pass queryHistorianTool as the third
   argument to createAgent. The workflow instance used by the tool is the one
   registered in Studio. See the exact code in the presenter Code changes section.
3. In agents/main/agent.ts, import createTool and ToolCallFilter. Add the third
   parameter historianTool: ReturnType<typeof createTool>. Register
   tools: { query_historian: historianTool }. The tool is created in index.ts;
   the agent receives it. Show that its model input is only question. The helper
   starts a fresh workflow run and returns its typed result. Add ToolCallFilter
   with exclude: ['query_historian'] so old
   result payloads are removed from subsequent model input. The prepared tool's
   toModelOutput supplies a short completion/error receipt for the current result.
   These do not remove the full result from Angular's chat messages.
4. Copy the prepared webinar-07.ts prompt from the presenter Code changes section
   into apps/agent-service/src/mastra/prompts/webinar-07.ts, then select the
   ../../prompts/webinar-07 import in agent.ts. Read its
   historian rules: pass the whole question once, display full stored readings,
   do not invent unseen results, and stop on failure. Average/count summaries
   are reserved for A2UI. The raise_alarm rules stay in this prompt.
5. In Angular app.ts, change type injectAgentStore to the value import
   injectAgentStore. In the constructor add
   this.resultStore.set(injectAgentStore('default')). This connects the prepared
   resultMessages/historianResult computation to the actual conversation.
   Explain: the store starts empty, so the grid cannot read chat messages until
   this line connects it. A new tool result updates the reactive computations.
   It does not send application state to the model or register agent context. Show the existing computation matching
   query_historian tool-call IDs and parsing their results. The prepared grid and
   linked displayMode open Historian result without a second display tool.
6. Wait for Mastra and Angular to reload; start a fresh Angular conversation.
   Keep the facility backend on 3101. No app config, chat runtime or backend
   code changes are needed. No additional service or port is introduced.

## Demonstrate

1. Show the AG-UI Chrome extension. Ask: **Show the latest ten air-temperature
   readings from the Cooling room.** Verify query_historian has the complete
   question and that the fixed Historian result grid opens with stored readings.
   The assistant should give a brief receipt rather than recite unseen values.
2. Show Mastra Studio at http://localhost:4212. Open the registered historian
   workflow and the trace for that Angular request. Show generated SQL, reviewer
   verdict, backend validation and returned rows. Distinguish semantic review
   from the deterministic execution boundary.
3. Ask: **Show the highest air-temperature reading for each shift manager.**
   Verify the result contains complete stored rows, including manager and time,
   not a new aggregate table. Switch to Snapshot and back to Historian result
   to show that Angular retains the result.
4. Ask: **What is the average air temperature in the Cooling room?** Explain
   that scalar summaries do not fit this chapter's fixed reading grid. The
   assistant should explain the limitation. It may refuse before a tool call;
   that alone is not a demonstration of backend SQL validation. Show the prepared
   deterministic validation code or local backend tests to explain that boundary.
5. Explain that the earlier approval flow remains available. A historian receipt
   does not authorize raising an alarm and does not let the model inspect the
   displayed rows. The operator supplies the reason and approves the action.

## Transition

“The question can now vary, but every result must still fit one fixed table.
Next, A2UI lets the application render other result shapes using trusted components.”

## Recovery

Run `git switch webinar-07` to open the saved chapter. To rehearse its implementation, start from `git switch webinar-06`.
Before switching, commit rehearsal edits on your own practice branch or save
them with `git stash push -u -m "webinar rehearsal"`. Git can carry edits
between branches or refuse a switch; switching alone does not discard them.

Restart `pnpm dev:backend`, wait for Angular and Mastra to reload, and start
a fresh chat. Restart `pnpm webinar:notes` if the presenter was already running.
All eight branches contain the same complete notes, demo prompts and code
references. Switching branches does not reset stored readings or alarms.
