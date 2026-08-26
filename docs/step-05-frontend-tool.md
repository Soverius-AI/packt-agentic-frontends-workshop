# Step 5 implementation brief — frontend view tool

## Objective

Add the first application capability to the Mastra agent without granting it
historian or backend data access. Both Angular and React expose one
CopilotKit frontend tool that can switch the current facility view and patch
the reading-log filters.

Create `05-frontend-tool` directly from the completed `04-mastra-agent`
checkpoint. Preserve all earlier milestones and create `06-sql-tool` directly
from this checkpoint.

## Fixed decisions

- Keep `/api/copilotkit`, the `default` agent id, the Mastra service, AG-UI
  streaming, and observability unchanged.
- Register exactly one browser-side tool named `configure_facility_view` in
  both framework hosts.
- Give the agent bounded context containing the current view, active filters,
  and available filter options.
- Do not expose readings, historian results, alarm details, or unrestricted
  application state in that context.
- Treat every update as a patch: omitted fields retain their current value.
- Resolve the literal `now` in the browser when the tool executes.
- Use `null` to clear a supplied filter and `clear_filters` to clear selected
  filters or the complete filter set.
- Keep SQL, backend tools, operational actions, and human approval out of this
  checkpoint.

## Frontend contract

The single frontend tool accepts two actions:

```text
configure_facility_view({
  action: "update",
  view?: "snapshot" | "reading-log",
  filters?: {
    from?: datetime | "now" | null,
    to?: datetime | "now" | null,
    shiftManager?: string | null,
    roomId?: string | null,
    metricId?: string | null,
    condition?: "normal" | "warning" | "critical" | "unavailable" | null
  }
})

configure_facility_view({
  action: "clear_filters",
  filters?: ("from" | "to" | "shiftManager" | "roomId" | "metricId" | "condition")[]
})
```

For `update`, every omitted field remains unchanged. For `clear_filters`, an
omitted filter list clears all filters; a supplied list clears only those
filters. Switching views also preserves the filters.

The agent receives this bounded frontend context on every run:

```text
current view + active filters + available rooms/metrics/managers/conditions
```

The context contains labels and identifiers needed to form a valid tool call,
but no current values or historical rows.

## Framework integration

Angular connects a computed signal to AG-UI context and applies tool commands
to the existing view and filter signals. React exposes the same context and
tool schema through hooks and applies the same shared patch reducer to its
existing state. The contract package owns the schemas, patch semantics, and
`now` resolution so the two hosts behave identically.

## Demonstration

1. Start in snapshot mode and ask: **Switch to the reading log and show only
   warnings from the Cooling room managed by Charles Bond.**
2. Confirm that the visible tab and filter controls change and that the
   existing reading-log endpoint renders the matching page.
3. Ask: **Change the start date to now.** Confirm that the room, condition,
   manager, and view remain unchanged.
4. Ask: **Clear the date filter.** Confirm that only the requested boundary is
   cleared.
5. Ask: **Clear all filters and return to the snapshot.**
6. Ask a historian-specific question and show that the agent still cannot
   inspect or aggregate readings.
7. Motivate Checkpoint 06: add one constrained read-only generated-SQL tool for
   questions that the predetermined frontend controls cannot answer.

If the user says "the date" while both or neither date boundaries are active,
the agent asks whether they mean the start or end date.

## Completion criteria

- The branch is based directly on `04-mastra-agent`.
- Angular and React register the same `configure_facility_view` frontend tool.
- The agent receives only the bounded view/filter context.
- Switching between snapshot and reading log works through the tool.
- All six reading-log filters can be patched without resetting omitted values.
- `now` is resolved using browser-local time at execution.
- Individual filters and the complete filter set can be cleared explicitly.
- The tool result reports the resulting state to the agent.
- No Mastra backend tool, SQL access, readings, alarm action, or approval flow
  is added.
- Shared-contract tests, frontend tests, Angular and React production builds,
  and the complete workspace check pass.
