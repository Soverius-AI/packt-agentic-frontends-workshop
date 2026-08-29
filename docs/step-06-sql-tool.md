# Step 6 implementation brief — reviewed generated SQL

## Objective

Add one flexible, read-only historian capability as an explicit Mastra workflow
without treating model review as authorization. The conversational agent passes
the operator's question to one backend tool. A dedicated generator agent creates
SQL, a separate reviewer checks whether it answers the question, and a
deterministic facility-service policy decides whether it may execute.

Create `06-sql-tool` directly from the completed `05-frontend-tool`
checkpoint. Preserve all earlier milestones and create `07-human-in-loop`
directly from this checkpoint.

## Fixed decisions

- Keep all seven browser-side tools and bounded view/filter context from Step 5.
- Add exactly one backend data tool:

  ```text
  query_historian({ question })
  ```

- Pass the operator's exact question through the model-facing tool schema. The
  conversational agent must not generate SQL.
- Register a tool-free `sql-generator` Mastra agent and a visible
  `historian-query` workflow with three typed steps: `generate-sql`,
  `review-sql`, and `deterministic-validate-and-execute`.
- Register a tool-free `sql-reviewer` Mastra agent. It checks semantic fit,
  schema use, time interpretation, grouping, ordering, and unsupported claims.
- A reviewer rejection stops before the facility boundary.
- Never use reviewer approval as the security decision.
- Keep SQLite ownership in `apps/facility-service`; the Mastra service calls
  its localhost historian endpoint rather than opening the facility file.
- Render the same structured result contract in Angular and React.
- Keep operational actions and human approval out of this checkpoint.

## Request flow

```text
Angular :4200 or React :5173
  -> /api/copilotkit on facility service :3001
  -> default Mastra agent :4111 calls query_historian({ question })
  -> historian-query workflow runs generate-sql with the sql-generator agent
  -> review-sql passes that exact proposal to the sql-reviewer agent
  -> deterministic-validate-and-execute calls POST /api/historian/query on :3001
  -> facility-owned deterministic policy validates and authorizes the exact statement
  -> worker opens facility SQLite read-only and executes with a deadline
  -> columns, rows, SQL, explanation, review, and policy metadata stream back
  -> CopilotKit renders the generic result in the active framework host
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
   view reads, and a focused set of aggregate, window, string, and date/time
   functions. Everything else is denied by default.
4. SQLite opens independently with `readOnly: true`, extension loading disabled,
   double-quoted string literals disabled, `query_only` enabled, and trusted
   schema disabled.
5. An outer limit caps the result at 200 rows, 64 columns, and 256 KB.
6. Execution runs in a worker that is terminated after 750 ms.

The result identifies whether rejection came from the reviewer, deterministic
validator, or execution layer. The primary agent cannot override any rejection.

## Demonstration

1. Ask: **Show me when the Cooling room went into warning during the last seven
   days and when each warning ended.**
2. Open the `historian-query` workflow in Mastra Studio and inspect the three
   typed steps, then expand the generated SQL and reviewer verdict in chat.
3. Confirm that earlier warning periods end at 14:00 factory time and the
   current warning is reported as **Still active**.
4. Ask: **Show me the maximum air temperature for shift manager Charles Bond
   and, below that, for Denise Weber.**
5. Show that the same tool answers the second question without another endpoint.
6. Submit a write statement and then two statements; confirm deterministic
   rejection before SQLite execution.
7. Motivate Checkpoint 07: flexible read-only analysis is useful, but an alarm
   action needs human authority and a correlated audit trail.

## Completion criteria

- `06-sql-tool` is based directly on `05-frontend-tool`.
- Mastra registers `default`, tool-free `sql-generator`, and tool-free
  `sql-reviewer` agents plus the `historian-query` workflow.
- The primary agent exposes one backend tool, `query_historian`.
- The backend tool accepts only the operator question; the dedicated generator
  workflow step produces SQL and an explanation.
- Reviewer rejection prevents the facility historian endpoint from being called.
- Deterministic validation remains authoritative after reviewer approval.
- Direct table access, writes, multiple statements, unauthorized functions,
  oversized results, and overlong execution are rejected.
- The two golden historian questions are supported through the same tool.
- Generated SQL, reviewer verdict, policy metadata, and generic rows render in
  Angular and React.
- Service, agent, Angular, and React production builds and the complete
  workspace check pass.
- The rendered Angular and React chat flows are visually verified.
