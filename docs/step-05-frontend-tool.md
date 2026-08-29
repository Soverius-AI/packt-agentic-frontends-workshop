# Step 5 implementation brief — frontend tools

## Objective

Add the first application capability to the Mastra agent without granting it
historian or backend data access. Both Angular and React expose seven focused
CopilotKit frontend tools that can discover supported filter options, switch
the current facility view, patch the reading-log filters, and clear filters.

Create `05-frontend-tool` directly from the completed `04-mastra-agent`
checkpoint. Preserve all earlier milestones and create `06-sql-tool` directly
from this checkpoint.

## Fixed decisions

- Keep `/api/copilotkit`, the `default` agent id, the Mastra service, AG-UI
  streaming, and observability unchanged.
- Register exactly seven browser-side tools named `list_rooms`, `list_metrics`,
  `list_shift_managers`, `list_conditions`, `set_view`, `update_filters`, and
  `clear_filters` in both framework hosts.
- Give the agent bounded context containing only the current view and active
  filters.
- Do not expose readings, historian results, alarm details, or unrestricted
  application state in that context.
- Treat every update as a patch: omitted fields retain their current value.
- Resolve the literal `now` in the browser when the tool executes.
- Use `null` to clear a supplied filter and `clear_filters` to clear selected
  filters or the complete filter set.
- Keep SQL, backend tools, operational actions, and human approval out of this
  checkpoint.

## Frontend contract

The frontend exposes four read-only catalog tools:

```text
list_rooms({})
list_metrics({ roomId?: string })
list_shift_managers({})
list_conditions({})
```

It exposes three mutation tools with focused parameter objects:

```text
set_view({
  view: "snapshot" | "reading-log"
})

update_filters({
  filters: {
    from?: datetime | "now" | null,
    to?: datetime | "now" | null,
    shiftManager?: string | null,
    roomId?: string | null,
    metricId?: string | null,
    condition?: "normal" | "warning" | "critical" | "unavailable" | null
  }
})

clear_filters({
  filters?: ("from" | "to" | "shiftManager" | "roomId" | "metricId" | "condition")[]
})
```

`set_view` changes only the view. For `update_filters`, every omitted filter
remains unchanged. For `clear_filters`, an omitted filter list clears all
filters; a supplied list clears only those filters. Switching views always
preserves the filters.

Each model-facing JSON Schema is a root object containing only the parameters
for that tool. The read tools return structured catalogs from the already-loaded
frontend data. The browser validates every payload, resolves bounded room/metric
labels or token-equivalent aliases to their canonical IDs, and returns a
structured error for unknown options without changing the current state.

The agent receives this bounded frontend context on every run:

```text
current view + active filters
```

The context contains no option catalogs, current readings, or historical rows.
The agent calls the appropriate read tool when it needs supported values.

## Framework integration

Angular connects a computed signal to AG-UI context and applies tool commands
to the existing view and filter signals. React exposes the same context and
tool schema through hooks and applies the same shared patch reducer to its
existing state. The contract package owns the schemas, patch semantics, and
`now` resolution so the two hosts behave identically.

## Demonstration

1. Start in snapshot mode and ask: **Which shift managers are available?**
   Confirm that the agent calls `list_shift_managers` and answers from its
   result.
2. Ask: **Which rooms and metrics are supported?** Confirm that the agent uses
   the corresponding read tools.
3. Ask: **Switch to the reading log and show only
   warnings from the Cooling room managed by Charles Bond.**
4. Confirm that the visible tab and filter controls change and that the
   existing reading-log endpoint renders the matching page.
5. Ask: **Change the start date to now.** Confirm that the room, condition,
   manager, and view remain unchanged.
6. Ask: **Clear the date filter.** Confirm that only the requested boundary is
   cleared.
7. Ask: **Clear all filters and return to the snapshot.**
8. Ask a historian-specific question and show that the agent still cannot
   inspect or aggregate readings.
9. Motivate Checkpoint 06: add one constrained read-only generated-SQL tool for
   questions that the predetermined frontend controls cannot answer.

If the user says "the date" while both or neither date boundaries are active,
the agent asks whether they mean the start or end date.

## Completion criteria

- The branch is based directly on `04-mastra-agent`.
- Angular and React register the same four catalog and three mutation frontend
  tools.
- The agent receives only the bounded current view/filter context and discovers
  available options through read tools.
- Switching between snapshot and reading log works through the tool.
- All six reading-log filters can be patched without resetting omitted values.
- `now` is resolved using browser-local time at execution.
- Individual filters and the complete filter set can be cleared explicitly.
- The tool result reports the resulting state to the agent.
- No Mastra backend tool, SQL access, readings, alarm action, or approval flow
  is added.
- Angular and React production builds and the complete workspace check pass.
