# Milestone 5 — four frontend tools

**Start:** `webinar-04`. **Completed:** `webinar-05`, checked out in
`packt-webinar-02`.

The completed chapter follows the presenter's four-tool implementation:

| Tool                  | Parameters             | Handler result                    |
| --------------------- | ---------------------- | --------------------------------- |
| `list_shift_managers` | Empty object           | Available manager names           |
| `list_rooms`          | Empty object           | Room IDs and names                |
| `set_view`            | Prepared view schema   | Selected view                     |
| `set_filter_values`   | Prepared filter schema | Updated state or validation error |

## Prepared support

The existing `setDisplayMode` and `updateFilters` methods are also called by the UI.
Angular-local input/output schemas live in `frontend-tool-schemas.ts`. The output
schemas are optional local validation; `registerFrontendTool` has no output-schema
property. The `main-05` prompt describes the four actual tools and their limits.
The SCSS fix is committed across webinar-01 through webinar-05; the completed
checkpoint also reconnects the existing streaming-scroll directive.

## Presenter implementation

Register the four tools in `setupTools()`, called synchronously from App's
constructor. Return `this.updateFilters(filterData)` so its promise and validation
result reach CopilotKit. Return the selected view after `setDisplayMode`.
Change the agent's prompt import from `main-04` to `main-05`. No app-config or
backend-runtime changes are needed. The default follow-up behavior lets the model
continue after a tool result without an explicit `followUp: true`.

This chapter deliberately has no `connectAgentContext`. List tools supply options
on demand; the model cannot observe later manual UI changes. No metric-discovery
tool is included, so metric IDs must be supplied explicitly or already confirmed.

## Speaker materials

- [Step-by-step speaker notes](speaker-notes/05-frontend-tools.md)
- [Demo prompts](demo-prompts.md#05--frontend-tools)
- Presenter desk: http://localhost:4400/#05/0
- Recovery: `pnpm webinar:select 05`; starting state: `pnpm webinar:select 04`

Use these notes and checkpoints instead of the older `workshop/solutions/05`
adapter implementation. The original milestone branches remain unchanged.
