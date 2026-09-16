# 07 — Query the historian through a backend tool

**Status:** Prepared walkthrough; live connections and the completed recovery checkpoint are pending.
**Start checkpoint:** webinar-06. **Working branch:** webinar-07.
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
2. In Mastra index.ts, import createHistorianQueryWorkflow, create one workflow
   with OPENROUTER_API_KEY, OPENROUTER_MODEL and http://127.0.0.1:3101, register it
   under workflows, and pass that same instance to createAgent. See the exact
   snippets in webinar/milestone-07.md. Registration makes the workflow visible
   in Studio. It does not itself give the conversational agent a callable tool.
3. In agents/main/agent.ts, add the workflow argument and use the prepared
   createQueryHistorianTool helper to register query_historian in tools. Show
   that the model input is only question. The helper starts a fresh workflow run
   and returns its typed result. Add ToolCallFilter for query_historian so old
   result payloads are removed from subsequent model input. The prepared tool's
   toModelOutput supplies a short completion/error receipt for the current result.
   These do not remove the full result from Angular's chat messages.
4. Select the prepared ../../prompts/webinar-07 prompt in agent.ts. Read its
   historian rules: pass the whole question once, display full stored readings,
   do not invent unseen results, and stop on failure. Average/count summaries
   are reserved for A2UI. The raise_alarm rules stay in this prompt.
5. In Angular app.ts, change type injectAgentStore to the value import
   injectAgentStore. In the constructor add
   this.resultStore.set(injectAgentStore('default')). This connects the prepared
   resultMessages/historianResult computation to the actual conversation.
   It does not register agent context. Show the existing computation matching
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

The completed 07 snapshot is not registered yet. After the presenter finishes the
connections, verify builds and the live flow, then save webinar-07 and add it to
manifest.json, solutions, demo-prompts.json and the presenter tests. Until then,
the presenter desk and selector expose completed chapters 01–06 only. The current
webinar:status may report 06 while the only changes are prepared support files.
Do not claim a chapter-07 recovery command is available yet.
