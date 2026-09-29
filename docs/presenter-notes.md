# AI DevCraft — backend demo presenter guide

For the interactive presenter website, run `pnpm presenter` and open http://localhost:4410. This Markdown file is the printable reference.

Use this guide for chapter 2. Branch `ai-devcraft/00-start` contains the presenter desk; the working demo is on `ai-devcraft/02-backend-agents`. Start with [Worktree setup](start-here.md). All code paths in the walkthrough are relative to whichever incident-management checkout you open.

## Slide 9: 02 · Backend agents

Keep the presenter desk running from branch 00. Open the second working checkout based on branch 02 for the app and code walkthrough. Follow the worktree instructions in README.md or section 00 of the presenter desk.

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



## Chapter 3 — CopilotKit and human approval

Branch 03 includes chapter 02. Use presenter desk sections 08–13.

### Chapter 3: switch to CopilotKit

- **Switch the application worktree**: Stop pnpm dev with Ctrl+C in the application terminal. Keep the presenter desk running in its separate checkout. Save any changes first. Create this local branch once; on later rehearsals use git switch ai-devcraft/live-ui.

```text
git fetch origin
git switch --no-track -c ai-devcraft/live-ui origin/ai-devcraft/03-agentic-ui
pnpm install
pnpm dev
```

- **The backend stays the same**: Reload Angular at http://localhost:4300. The chapter label now says Agentic UI · CopilotKit. Branch 03 includes the latest chapter 02 workflow: SQL generation, deterministic preflight, Jev review and protected execution.

- **What the frontend adds**: Say: “The same backend is now a tool in a conversation. The frontend can show progress, change the view and pause an alarm proposal for a human decision.” There is no A2UI example in this chapter.

### Connect the agent and UI

- **Start with the chat**: Open app.config.ts and chat.component.ts. Show provideCopilotKit pointing at /api/copilotkit and copilot-chat using agentId default. This is the UI connection.

- **Follow the server connection**: Open copilot-runtime.ts. MastraAgent connects the runtime to Mastra; HistorianBridge adds investigation activity events to the stream.

- **Show what the agent may do**: Open the main agent. It has query_historian and discovers frontend tools through the runtime. The alarm instruction allows proposals only after an explicit request. The model does not write the alarm directly.

### Demo: query with activity

- **Ask the same successful question**: Use the prompt below in chat. Keep the table and activity card visible.

```text
Show the highest air temperature for each shift manager.
```

- **Read the activity and result**: Show the running activity followed by Investigation complete and three returned readings. Point out the populated date/time, manager, room, metric, value and condition. Activity reflects actual tool events; it is not a timer or a per-step percentage.

- **Connect the result to the table**: In connect-facility-agent.ts, show historianResult and the effect calling showHistorianResult. The frontend consumes the structured tool result. The agent receives a short acknowledgment rather than the complete reading payload.

- **Reuse the backend walkthrough**: In Studio, inspect query_historian and its historianQueryWorkflow run. The four steps and Jev checks are the same as chapter 2. The chat agent chooses the tool; the workflow executes it.

### Demo: frontend tools

- **Let the agent adjust the view**: Enter the prompt below. Show Reading log selected and Cooling room selected in the room filter.

```text
Switch to the reading log and show only the Cooling room.
```

- **Show context and tool registration**: In connect-facility-agent.ts, show connectAgentContext, list_rooms, set_view and update_filters. The context shares view state and timezone. Tools return available options and update the existing Angular store.

- **Keep the distinction clear**: Say: “This changes the interface. The previous example generated SQL on the backend. Both use the same chat, but they use different tools.”

### Demo: human approval

- **Check the alarm before the demo**: Select Snapshot and inspect Packaging hall → Air temperature. It should say not raised. If a previous rehearsal already raised it, resolve that demo alarm with the normal UI before presenting, or use another unraised metric and adapt the prompt. Keep the audit.

- **Ask for an alarm proposal**: Enter the prompt below. Pause when the approval card appears. Show room, metric, reason and operator. The alarm has not been raised yet.

```text
Raise an alarm for the Packaging hall air temperature because I want the operator to investigate.
```

- **Reject first**: Click Reject. Show Rejected · no alarm was raised, the rejected audit entry and the resumed assistant acknowledgment. The active alarm count must not increase.

- **Create a new proposal**: Ask again using the prompt below. A new proposal needs a new human decision.

```text
Please propose that alarm again for Packaging hall air temperature. I want to approve it this time.
```

- **Approve and inspect the outcome**: Click Approve and raise alarm. Show Approved · alarm raised, the active alarm count increasing by one, the approved audit entry and the assistant acknowledgment. Approval and execution are distinct: an already-active alarm produces an execution-failed outcome.

- **Name the demo boundary**: The facility backend performs the write and records both decisions. This workshop uses the fixed demo operator night-reception; it does not implement production authentication or role-based authorization.

### Walk through human approval

- **Register the human step**: At the end of connect-facility-agent.ts, show review_alarm, its schema and AlarmApprovalCard. This is the pause point exposed to the agent.

- **Follow the human click**: In AlarmApprovalCard, follow decide: validate the proposal against the facility catalog, wait for the operator, call the store, then pass the recorded outcome to toolCall.respond. Both approval and rejection resume the conversation.

- **Follow the backend write**: Open facility-store.ts → decideAlarmApproval and facility-client.ts → decideAlarmApproval in the app checkout. Follow POST /api/alarm-approvals in server.ts into repository.ts. The transaction checks the metric, records the decision and creates an alarm only when approved.

- **Explain retries with one concrete example**: The message/tool-call identity remains stable when the card reopens or a request is retried. The backend returns the recorded result for that same decision rather than creating a second alarm. A conflicting decision is rejected.

- **Close with the failure paths**: An invalid proposal can be dismissed without executing it, so the conversation can continue. A failed HTTP request shows an error and allows retry. An approved but failed alarm operation is displayed as failed, not as success.
