# 05 — Give the agent four Angular tools

**Start branch:** `webinar-04`. **Completed branch:** `webinar-05`.
**Current worktree:** `packt-webinar-02`, branch `webinar-06`.
**Recovery:** `pnpm webinar:select 05`, wait for Angular and Mastra to reload,
then start a fresh conversation. If selecting from an earlier backend chapter,
restart `pnpm dev:backend` too.
**Ports:** Angular 4200, facility backend 3101, Mastra API 4211, Studio 4212,
presenter desk 4400. Use `pnpm dev:all` to start the four application services.
The UI methods, filter schemas and `main-05` prompt are prepared. The chat layout
CSS is prepared across webinar-01 through webinar-05. This checkpoint also
reconnects the existing streaming-scroll directive; that is support wiring,
not an additional agent concept to teach.

## Say

“The model can request a tool call. Angular executes the handler using the same
methods and signals as our existing UI. The result goes back to the model, which
can then answer or request another tool.”

“We use four tools: two discover available options, and two change the interface.
We are not connecting reactive agent context in this chapter.”

## Open and change

1. Open `apps/angular-host/src/app/app.ts`. Import `registerFrontendTool` from
   `@copilotkit/angular`, `z` from `zod`, and the prepared `setViewInputSchema`
   and `updateFiltersInputSchema` from `./frontend-tool-schemas`. Add a
   `setupTools()` method and call it synchronously from the constructor so the
   registrations run in Angular's injection context.
2. Register `list_shift_managers` with `agentId: 'default'`, a short description,
   `parameters: z.object({})` and `handler: async () => this.shiftManagerOptions()`.
   Explain: empty parameters means the model sends `{}`. The returned array is
   the actual tool result, not an output schema. No separate output schema is required.
3. Register `list_rooms` the same way. Its handler returns
   `this.rooms().map(({ id, name }) => ({ id, name }))`. Show why the model needs
   both the name the operator says and the ID the filter expects. No readings are returned.
4. Register `set_view`, using `setViewInputSchema` for `parameters`. In its async
   handler call `this.setDisplayMode(input.view)` and return
   `{ view: this.displayMode() }`. Show that the existing view buttons call the
   same method. The return value confirms which view was selected.
5. Register `set_filter_values`, using `updateFiltersInputSchema`. Use
   `handler: (filterData) => this.updateFilters(filterData)`. Return that promise:
   CopilotKit must wait for completion and receive either the state or the
   validation error. Describe the semantics accurately: omission preserves a
   field, null clears that field, and `"now"` is resolved by the browser clock.
   Show the existing manual controls using the same `updateFilters` method.
6. Open `apps/agent-service/src/mastra/agents/main/agent.ts` and change the prompt
   import from `main-04` to the prepared `main-05`. Read the four tool names and
   the limits aloud. Mastra's `tools: {}` stays as it is: CopilotKit supplies the
   frontend tool definitions per request, while their handlers execute in Angular.
   No change to `app.config.ts` or the facility runtime is needed.
7. Explain `followUp`: the installed registration defaults to continuing the
   agent after a successful tool call. We omit the explicit flag. A returned
   `{ ok: false, error }` is ordinary result data; the prompt tells the agent to
   inspect it rather than claim success. The agent may discover options and then
   call a modifying tool within one conversation turn.

## Demonstrate

1. **Show the AG-UI Chrome extension again.** Ask: **Which rooms and shift managers
   are available?** Inspect `list_rooms` and `list_shift_managers`, their empty
   input objects, and their returned arrays. Compare names with the manual filters.
2. Ask: **Switch to the reading log and show only warnings from the Cooling room
   managed by Charles Bond.** Follow the tool calls and results, then verify the
   selected view, room, manager and condition in Angular. Depending on the prior
   conversation, discovery may already be satisfied by the previous tool results.
3. Ask: **Change only the start date to now.** Show that only the start boundary
   changes and other filters remain selected. Zero matching readings is valid:
   this is a filter demonstration, not evidence of a backend problem.
4. Ask: **Clear only the start date.** Verify that room, manager and condition stay
   unchanged. Explicit null clears one field; it does not clear every filter.
5. **Show Mastra Studio at http://localhost:4212.** Open the trace for an Angular
   request and identify tool calls and returned results. Explain that Studio's
   standalone chat has no Angular handlers attached. Ask in Angular: **What is
   the current air temperature in our Cooling room?** The agent should explain
   that these tools do not give it access to measurements.

## Explain the boundary

The agent learns room and manager options through tool results. It does not receive
reactive context. Do not demonstrate “Which filters are currently active?” after
manual edits: there is no read-current-state tool, and old tool results may be stale.
Patching only specified fields still preserves manual selections because Angular
owns that behavior; the model need not know the omitted values.

There is no metric-list tool in this chapter. Metric-specific filtering requires
an exact metric ID from the operator or a prior confirmed result. Do not guess IDs.
The shared input schema remains prepared for that field; the demos use rooms,
shift managers, conditions and dates.

## Transition

“The agent can discover options and operate the UI. Next, in webinar 06, it can
propose raising an alarm, but a person must approve or reject the action. We add
metric discovery and connect the prepared approval card. Reading measurements
through the historian comes afterwards, in webinar 07.”

## Recovery

Run `pnpm webinar:select 05` in this worktree and reload Angular after its build
and Mastra's reload finish. The selector restores twelve implementation paths,
including the completed frontend registrations and Mastra prompt import. Shared
schemas, prompt text and layout support remain prepared. It backs up current files
and does not switch branches or reset data. Use `pnpm webinar:select 04` to rehearse
adding the tools again. Keep API keys off screen.
