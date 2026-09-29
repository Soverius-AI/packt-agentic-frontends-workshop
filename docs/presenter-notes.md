# AI DevCraft — backend demo presenter guide

Use this guide for chapter 2. Branch `ai-devcraft/00-start` captures the working demo from `ai-devcraft/02-backend-agents`. Start with [Worktree setup](start-here.md). All code paths in the walkthrough are relative to whichever incident-management checkout you open.

## Slide 9: 02 · Backend agents

Introduce chapter 2: the backend turns a natural-language question into a checked SQL query. Chapter 3 will add CopilotKit and AG-UI; this branch uses an ordinary Angular form and HTTP request.

Before presenting:
- Open the incident-management checkout in VS Code. Use ai-devcraft/00-start in the second worktree; the original checkout remains on ai-devcraft/02-backend-agents.
- If the services are not already running, run pnpm dev from that folder. The generator and Jev use OPENROUTER_API_KEY; keep the environment file off screen.
- Have the Angular app at http://localhost:4300 and Mastra Studio at http://localhost:4211 open in separate tabs.
- Rehearse the two prompts in slide 14. Keep their runs available in Studio as a fallback. Model-generated SQL can vary between runs.
- Press N in the deck to open the current slide's speaker notes.

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

