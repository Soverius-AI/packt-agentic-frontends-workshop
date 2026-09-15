# Milestone 5 — two frontend tools and reactive context

## Prepared on webinar-01 through webinar-04

- The template and the tool can both call App's `setDisplayMode` and `updateFilters`.
- `updateFilters` accepts values, preserves omitted filters, clears explicit nulls,
  validates option IDs and dates, and reloads readings once.
- `facilityViewState` is a computed signal. Available options come from the existing
  room, metric and shift-manager signals. No measurement values need to be shared.
- `apps/angular-host/src/app/frontend-tool-schemas.ts` contains the input and output
  schemas for `set_view` and `update_filters`. No shared filter-schema library is needed.
- Zod is installed in Angular. Mastra does not import the frontend schemas.
- There are no tool registrations, context registrations or WorkshopHost adapters.
- The result-store field is inactive preparation for later historian/A2UI views;
  connecting it is not required for these tools or context.

## What the presenter writes in milestone 5

1. Call `connectAgentContext` directly in App's constructor. Pass a callback that
   reads `facilityViewState`, the user's timezone and available rooms, metrics,
   shift managers and conditions. Explain that the callback tracks signal changes:
   subsequent requests receive the current selection. It does not trigger a model
   call when a control changes, and it does not expose readings.
2. Register `set_view` directly in the constructor. Use `setViewInputSchema` as
   `parameters`; its async handler calls `this.setDisplayMode(view)` and returns
   `{ view: this.displayMode() }`. That is the same method used by the view buttons.
3. Register `update_filters` beside it. Use `updateFiltersInputSchema` as
   `parameters`; its handler returns `this.updateFilters(filters)`. Describe that
   omitted fields preserve values, null clears one, and "now" uses the browser clock.
4. Change the Mastra agent's prompt import from `main-04` to `main-05` and explain
   the two tools and supplied context. Keep Mastra's `tools: {}`. The browser's
   tool definitions travel through CopilotKit to Mastra; the handlers run in Angular.

Keep `agentId: 'default'` and `followUp: true` on both registrations. The installed
`registerFrontendTool` accepts an input schema through `parameters`; it has no
output-schema option. Output schemas are optional local validation in the handler,
not a separate registration or a Mastra dependency.

## Demonstration

1. Show the AG-UI Chrome extension and ask: **Switch to the reading log and show
   only warnings from the Cooling room managed by Charles Bond.** Inspect the two
   tool calls and compare with the visible controls.
2. Change a filter manually. Ask **Which filters are currently active?** to
   demonstrate why the reactive context is provided alongside the tools.
3. Ask **Change only the start date to now.** Verify that room, manager and condition
   remain unchanged. The tool description and schema explain the "now" convention;
   the application resolves the timestamp.
4. Ask **Clear only the start date.** The other filters remain unchanged.

Mastra and Angular watch source edits. Reload Angular and start a fresh conversation
for a clean rehearsal. No backend runtime changes are needed in milestone 5.

The finished milestone-5 implementation is not saved yet. Do not use the old
workshop/solutions/05 adapter implementation on this simplified baseline.
