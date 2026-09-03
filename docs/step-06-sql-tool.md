# Step 6 implementation brief — reviewed generated SQL

## Objective

Add one flexible, read-only historian capability as an explicit Mastra workflow
without treating model review as authorization. The conversational agent passes
the operator's question to a narrow tool. That tool starts the separately
registered workflow. A dedicated generator agent creates SQL, a separate
reviewer checks whether it answers the question, and a deterministic
facility-service policy decides whether it may execute.

Create `06-sql-tool` directly from the completed `05-frontend-tool`
checkpoint. Preserve all earlier milestones and create `07-human-in-loop`
directly from this checkpoint.

## Fixed decisions

- Keep all seven browser-side tools and bounded view/filter context from Step 5.
- Assign exactly one backend tool to the primary agent:

  ```text
  query_historian({ question })
  ```

- Pass the operator's exact question through the workflow input schema. The
  conversational agent must not generate SQL. Keep the tool adapter thin: it
  only creates a fresh workflow run, passes the question, and returns the typed
  result.
- Keep a tool-free `sql-generator` Mastra agent private to the visible
  `historian-query` workflow, which has three typed steps: `generate-sql`,
  `review-sql`, and `deterministic-validate-and-execute`.
- Keep a tool-free `sql-reviewer` Mastra agent private to that workflow. It
  checks semantic fit, schema use, time interpretation, grouping, ordering,
  and unsupported claims.
- A reviewer rejection stops before the facility boundary.
- Never use reviewer approval as the security decision.
- Keep SQLite ownership in `apps/facility-service`; the Mastra service calls
  its localhost historian endpoint rather than opening the facility file.
- Return only complete historian-reading records that fit the existing fixed
  reading-log grid. Maximum and minimum questions select the underlying stored
  readings; computed summaries such as averages and counts are rejected until
  the later A2UI checkpoint.
- In Angular, register `show_historian_readings` as a frontend tool. After a
  successful backend query, it receives the validated complete readings, sets
  the historian-result signal, and opens the dedicated Historian result view.
- Treat Snapshot, Reading log, and Historian result as three explicit views.
  Reading log and Historian result reuse the same fixed reading table. Preserve
  the latest historian result when switching views so its tab remains available
  until another query replaces it. Do not render the backend tool call as a card
  in chat.
- Keep operational actions and human approval out of this checkpoint.

## Request flow

```text
Angular :4200 or React :5173
  -> /api/copilotkit on facility service :3001
  -> default Mastra agent :4111 selects query_historian
  -> query_historian starts historian-query with the same question
  -> historian-query workflow runs generate-sql with the sql-generator agent
  -> review-sql passes that exact proposal to the sql-reviewer agent
  -> deterministic-validate-and-execute calls POST /api/historian/query on :3001
  -> facility-owned deterministic policy validates and authorizes the exact statement
  -> worker opens facility SQLite read-only and executes with a deadline
  -> fixed-shape reading entries plus SQL, review, and policy metadata stream back
  -> default agent calls show_historian_readings with the validated entries
  -> Angular frontend tool opens the Historian result view and populates the shared grid
```

No additional process or port is introduced. Mastra's local LibSQL file still
stores agent observability; the facility SQLite file still owns plant data.

## Deterministic policy

The execution boundary applies defense in depth:

1. A lexical preflight accepts exactly one `SELECT` or read-only `WITH`
   statement and rejects write, schema, transaction, attachment, pragma,
   explain, and recursive operations.
2. Generated SQL can read only the dedicated `historian_readings` view, whose
   columns expose timestamps, rooms, metrics, values, managers, units, and the
   derived reading condition.
3. SQLite's runtime authorizer allows only approved view columns, underlying
   view reads, extrema, window, string, and date/time functions. Average,
   count, sum, and total functions are denied in this checkpoint.
4. SQLite opens independently with `readOnly: true`, extension loading disabled,
   double-quoted string literals disabled, `query_only` enabled, and trusted
   schema disabled.
5. The final projection must contain the eleven fields of a complete historian
   reading in their prescribed order. An outer limit caps the result at 200
   records and 256 KB.
6. Execution runs in a worker that is terminated after 750 ms.

The result identifies whether rejection came from the reviewer, deterministic
validator, or execution layer. The primary agent cannot override any rejection.

## Demonstration

1. Ask: **Show me when the Cooling room went into warning during the last seven
   days and when each warning ended.**
2. Open the `historian-query` workflow in Mastra Studio and inspect the three
   typed steps and generated SQL.
3. Confirm that the agent calls `show_historian_readings` and the selected
   complete readings appear in the dedicated Historian result view rather than
   as a chat card.
4. Ask: **Show me the maximum air temperature for each shift manager.**
5. Confirm that one complete stored reading per manager appears in the fixed grid.
6. Ask for the average temperature and the number of readings; confirm both are
   rejected as unsupported result shapes reserved for the later A2UI checkpoint.
7. Submit a write statement and then two statements; confirm deterministic
   rejection before SQLite execution.
8. Motivate Checkpoint 07: flexible read-only selection is useful, but an alarm
   action needs human authority and a correlated audit trail.

## Completion criteria

- `06-sql-tool` is based directly on `05-frontend-tool`.
- Mastra registers only the `default` conversational agent and the
  `historian-query` workflow. The tool-free generator and reviewer agents are
  workflow-private implementation details.
- The primary agent receives only `query_historian` through its `tools`
  configuration; its model-visible input contains only `question`.
- The thin backend tool starts a fresh run of the globally registered
  `historian-query` workflow, which remains visible in Mastra Studio.
- The workflow accepts only the operator question; the dedicated generator step
  produces SQL and an explanation.
- Reviewer rejection prevents the facility historian endpoint from being called.
- Deterministic validation remains authoritative after reviewer approval.
- Direct table access, writes, multiple statements, unauthorized functions,
  oversized results, and overlong execution are rejected.
- Maximum-reading questions return complete stored records through the same workflow.
- Average, count, and other computed result shapes fail with a clear error.
- In Angular, successful results cause an explicit `show_historian_readings`
  frontend call that switches to the Historian result view and populates the
  shared fixed grid without a tool card in chat.
- Service, agent, Angular, and React production builds and the complete
  workspace check pass.
- The rendered Angular frontend-tool and grid-update flow is visually verified.
