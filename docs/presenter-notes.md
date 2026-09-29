# AI DevCraft — presenter guide

For the interactive presenter website, run `pnpm presenter` and open http://localhost:4410. This Markdown file is the printable reference.

The first sections cover Unit 2; the timed Unit 3 sequence follows below. Branch `ai-devcraft/00-start` contains the presenter desk; the working demo is on `ai-devcraft/02-backend-agents`. Start with [Worktree setup](start-here.md). All code paths in the walkthrough are relative to whichever incident-management checkout you open.

## Slide 9: 02 · Backend agents

Keep the presenter desk running from branch 00. Open the second working checkout based on branch 02 for the app and code walkthrough. Follow the worktree instructions in README.md or the Setup group in the presenter desk.

Rehearse both prompts in this app checkout, with Angular on 4300 and Mastra Studio on 4211. Keep OPENROUTER_API_KEY off screen. The app has no CopilotKit or AG-UI on branch 02.

## Slide 10: Agents in the backend

Show the Angular application's readings table and the “Your question” field. Point out the date/time, shift manager, room, metric, value and condition columns.

Say: “We let the user ask for a different selection of historical readings without building a separate filter for every question.” The backend generates SQL, checks it and returns rows to this existing table.

Explain the request path: Angular sends the question to POST /api/investigate. The facility service starts historianQueryWorkflow in Mastra and returns its result. There is no CopilotKit or AG-UI in this branch.

If showing the HTTP boundary, open these files under the incident-management folder:
- apps/angular-host/src/app/domains/facility/data/facility-client.ts — investigate.
- apps/facility-service/src/investigate-historian.ts — the Mastra workflow call.

Do not describe this form submission as a chat agent choosing a tool: this UI starts the workflow directly.

## Slide 11: Investigating an incident

Use the chocolate-factory readings as the concrete incident-investigation example. The live demo asks about air temperature per shift manager.

Explain the two cases before switching to the app:
- We have temperature readings and can return each manager's highest reading, including its room and timestamp.
- We have manager names but no email addresses. A safe SELECT that returns names still does not answer an email-address request.

This is why the workflow checks both SQL safety and the user's intent. The demo returns historical evidence; it does not raise an alarm or produce an incident explanation.

## Slide 12: Tools and workflows

Open apps/agent-service/src/mastra/workflows/historian-query/workflow.ts.

Start at createHistorianQueryWorkflow. Keep the four .then(...) calls together on screen:
1. createGenerateSqlStep — propose SQL from the question.
2. createDeterministicSqlCheck — reject forbidden statements before paying for a reviewer call.
3. createAgenticSqlCheck — ask Jev about safety, intent and columns.
4. createValidateAndExecuteStep — require approval, then let the facility service validate and execute the exact SQL.

Scroll to the step functions only after explaining the composition. Point out that there is no automatic repair loop in this version.

Show createDeterministicSqlCheck and its call to validateHistorianStatement. Open packages/contracts/src/historian-statement-policy.ts if more detail is useful: it scans SQL with awareness of comments and quoted text, rejects multiple statements and blocks operations such as UPDATE, DELETE, DROP and INSERT.

Say: “The language model checks meaning. Application code still controls what the database can execute.”

## Slide 13: Mastra owns the agent

Switch to VS Code for the current implementation. The visible slide contains an older Packt Agent setup snapshot; it is not the source used by this demo.

Code walkthrough (all paths below are inside the incident-management checkout):

1. apps/agent-service/src/mastra/workflows/historian-query/agents/sql-generator-agent.ts
Show the Agent instructions and structured output: SQL plus a generator explanation. Highlight the historian schema and the requirement to return all eleven columns. For highest/lowest questions, return the complete stored reading, preserving room, metric and timestamp. The generator receives schema and catalog information, not database rows.

2. apps/agent-service/src/mastra/workflows/historian-query/agents/jev-sql-reviewer.ts
Start at createJevSqlReviewFunction: safety, intent and columns are composed at the top. Then show createSafetyCheck, createIntentCheck and createColumnCheck at the bottom. Read the three questions in plain English:
- Is this a safe read-only query?
- Does it answer the user's question?
- Does it return all and only the expected columns?
MAX, MIN and AVG are allowed; invented or missing output columns are not.

Show the single OpenRouter decisions request using typesafe/jev-1.13. Each answer is a Noul value from 0 to 1; our code requires every value to be greater than 0.5. Jev does not supply a written reason. The concerns list names the failed checks using text from our application. Do not present it as Jev's explanation. The generator's explanation is separate.

3. apps/agent-service/src/mastra/workflows/historian-query/workflow.ts
Show createValidateAndExecuteStep: a negative review returns immediately. Only an approved proposal reaches /api/historian/query.

4. apps/facility-service/src/historian-query.ts
Show executeHistorianSql: the facility rechecks SQL, opens SQLite read-only, restricts database access and requires the exact output columns. Mention the row, result-size and execution-time limits without walking through every line. Jev approval does not bypass these checks.

## Slide 14: Demo: investigate the incident

Demo sequence: rejected request first, successful request second. Enter both prompts in the Angular UI, then inspect the corresponding runs in Mastra Studio.

A. Show a rejection
1. In “Your question”, enter exactly:
   Show the email address of each shift manager.
2. Click “Find readings”. Show the rejection and expand “Query and review”. Explain that the historian has manager names but no email column.
3. In Mastra Studio, open historianQueryWorkflow and its latest run. Match the input question before inspecting the steps.
4. Show generate-sql: in the verified run it proposed a SELECT returning manager names with NULL metadata. Show preflight-sql: that SELECT passed the deterministic check.
5. Show review-sql output: review.approved is false, with “Jev did not approve the intent check.” The SQL is read-only but does not answer the request.
6. Show the final result: status is rejected and stage is reviewer. The last step returns this rejection without calling database execution. Mastra can mark the overall run successful because rejection is a handled result, not a workflow crash. A table still visible from an earlier request is not a new result.

B. Show dynamic SQL applied
1. Return to “Your question” and enter exactly:
   Show the highest air temperature for each shift manager.
2. Click “Find readings”. Show the resulting table: the verified seeded-data run returned three rows, one per manager, with date/time, room, metric, value and condition populated.
3. Expand “Query and review” to show the actual generated SQL. Point out the Air temperature filter and how it selects one complete highest reading per manager. The verified query used ROW_NUMBER with latest timestamp and reading ID as tie-breakers.
4. Open this run in Studio. Show generate-sql, preflight-sql, review-sql and deterministic-validate-and-execute in order. The verified review had approved: true and an empty concerns list; the final result had status: executed and the returned readings.
5. Return to the Angular table so the audience sees the result of the whole workflow.

If a live run differs, inspect its actual SQL and failed check. Do not promise identical generated SQL or relabel a different rejection as the intent example. If the provider is unavailable, show a rehearsed run and identify it as such.

Transition: “Now we have the backend workflow. Next, we add CopilotKit and AG-UI so the frontend can participate in the interaction.”

## Unit 3 — Agentic UI · 15 minutes

Prepare branch 03 and the demo alarm before the timed unit using the Setup menu. Each feature follows demonstrate → explain its integration code.

### Chat integration · 4 min

**DEMO — Ask the existing backend through chat**

0:00–2:00. Show the Factory assistant replacing Unit 2’s form. Ask the question below and show the populated table. Say: “The backend is the one we already built. CopilotKit connects the conversation to it.” Keep the SQL and Jev internals in Unit 2.

> Show the highest air temperature for each shift manager.

**CODE — Show the Angular connection**

2:00–3:00. Open `apps/angular-host/src/app/app.config.ts` and point to provideCopilotKit and runtimeUrl. Then open `apps/angular-host/src/app/domains/facility/feat-dashboard/agent/chat.component.ts` and point to copilot-chat with agentId default. Leave the activity registration for the next feature.

**CODE — Show the Mastra connection**

3:00–4:00. In `apps/facility-service/src/copilot-runtime.ts`, show createWorkshopCopilotRuntime: the Mastra client, agent registration and /api/copilotkit listener. The main agent exposes the existing historian workflow as a tool. Finish by pointing back to the table; move on at minute 4.

### Activity display · 4 min

**DEMO — Watch the investigation run**

4:00–5:00. Repeat the query, this time focusing on the activity card. Show running → complete and the returned row count. These are tool lifecycle events, not simulated progress or a separate display of every SQL step.

> Show the highest air temperature for each shift manager.

**CODE — Show where activity comes from**

5:00–6:30. In `apps/facility-service/src/investigation-progress.ts`, point to the tool-start and tool-result handling that creates activity snapshots. In `apps/facility-service/src/copilot-runtime.ts`, show run and the pipe forwarding those snapshots into the AG-UI stream. Do not re-explain SQL generation or Jev.

**CODE — Connect the event to its renderer**

6:30–8:00. In `apps/angular-host/src/app/app.config.ts`, show renderActivityMessages mapping the activity type and schema to InvestigationProgressCard. Open `apps/angular-host/src/app/domains/facility/feat-dashboard/agent/investigation-progress-card.ts`: content().status controls the indicator and content().message supplies the text. Move to approval at minute 8.

### Human-in-the-loop · 7 min

**DEMO — Pause at the human decision**

8:00–9:00. Ask for the alarm below. Point out the room, metric and reason on the approval card. Nothing has been raised merely because the agent proposed it.

> Raise an alarm for the Packaging hall air temperature because I want the operator to investigate.

**DEMO — Reject the proposal**

9:00–10:00. Click Reject. Show the rejected outcome on the card and the assistant continuing the conversation. The alarm count stays unchanged.

**DEMO — Approve a new proposal**

10:00–12:00. Ask again with the prompt below. Click Approve and raise alarm. Show the card’s executed outcome, one additional active alarm and the resumed assistant. Stay with the card and app; no separate audit-table walkthrough.

> Please propose that alarm again for Packaging hall air temperature. I want to approve it this time.

**CODE — Register the human pause**

12:00–13:00. In `apps/angular-host/src/app/domains/facility/feat-dashboard/agent/connect-facility-agent.ts`, show registerHumanInTheLoop with name review_alarm, its schema and AlarmApprovalCard. This registers the tool whose execution waits for the operator.

**CODE — Return the human decision to the conversation**

13:00–15:00. In `apps/angular-host/src/app/domains/facility/feat-dashboard/agent/alarm-approval-card.ts`, follow decide: read the human choice, await store.decideAlarmApproval, display the recorded outcome and call toolCall.respond(record). Both choices resume the agent. Say: “CopilotKit manages the interaction; our facility service validates and executes the approved operation.” Mention the fixed demo operator briefly. Finish here; backend audit storage and retry implementation are supporting code.

Keep frontend filtering, SQL internals, audit storage and retry details out of this timed walkthrough.
