# 05 — Connect model intent to existing UI operations

**Start:** completed 04. **Completed code:** [solution 05](../solutions/05/).

**Demo inputs:** Follow the numbered prompts for milestone 05 in the
[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts
in the Presenter desk. Each includes setup, expected results and what to show.

## Say

“The model chooses a named operation with structured arguments. Angular applies
that operation to its existing state. We expose a small view description and
discovery tools, not the entire application or its database.”

## Open and change

1. `apps/angular-host/src/app/workshop/connect.ts`: add `connectViewContext(host)`
   and `registerFacilityTools(host)` with their prepared imports.
2. Open `workshop/prepared-tools.ts`: explain `connectAgentContext`, then one
   discovery tool (`list_rooms`) and one action (`update_filters`). There are four
   catalog tools and three view/filter tools; do not type all seven registrations.
3. Point to the schema, description, `agentId`, validation, and handler. The
   handler reaches the existing `configureFacilityView` operation through the
   prepared host adapter. The call executes in Angular's injection context.
4. In `apps/agent-service/src/mastra/agents/main/agent.ts`, change the prompt import
   from `main-04` to `main-05`. Keep backend `tools: {}`: these tools come from the
   browser, not the Mastra server tool list.
5. Wait for Mastra to reload automatically, then reload the browser. Keep `pnpm dev` running.

## Demonstrate

Ask: **Which rooms and shift managers can I filter by?** Inspect discovery calls.

Then: **Switch to the reading log and show only warnings from the Cooling room managed by Charles Bond.**

Expected: Reading log, room, condition and manager reflect the request.

Then: **Change the start date to now.**

Before sending, say which values should stay the same. Afterward, inspect all
filters: only the start boundary changes. A temporarily empty log is reasonable
because the range starts now. Clear the start date and show the prior filters remain.

Explain omitted fields versus explicit clearing. For a code-level explanation,
open `applyFacilityViewCommand` in `packages/contracts/src/index.ts`; that is the
prepared patch behavior behind the visible controls. IDs must now match the
values returned by discovery exactly; there is no fuzzy name-to-ID conversion.
Natural-language room names are fine in chat because the agent first discovers IDs.

## Transition

“These tools can operate existing filters. A question such as maximum temperature
per manager needs a different data capability.”

## Recovery

Select 05 and wait for Mastra to reload, then refresh the app and Studio. Restart
the backend launcher only if its presenter file changed. If the model guesses an option, ask for discovery
first and inspect the returned IDs. If filters unexpectedly disappear, inspect
the patch arguments and handler before changing the model prompt.
