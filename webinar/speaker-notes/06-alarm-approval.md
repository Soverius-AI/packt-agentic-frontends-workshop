# 06 — Raise an alarm with human approval

**Start branch:** `webinar-05`. **Completed branch:** `webinar-06`.
**Current directory:** `packt-webinar-02`; use the start branch above for rehearsal.
**Completed checkpoint:** `git switch webinar-06`. Rehearse from `webinar-05`.
**Ports:** Angular 4200, facility backend 3101, Mastra API 4211, Studio 4212,
presenter desk 4400. Use `pnpm dev:all` for the four application services.
This chapter brings original milestone 7 forward. Historian queries follow in
webinar 07. The approval card, input schema, backend endpoint, audit table and
refresh subscription are already prepared. The presenter connects them.

## Say

“The model can propose an action. A person decides whether it should happen.
The tool result tells the model what the backend actually did.”

“Last chapter our tools changed the view and filters. Raising an alarm changes
facility data, so we add an explicit approval step before that action executes.”

## Open and change

1. Open `apps/angular-host/src/app/app.ts`, inside `setupTools()`. Register
   `list_metrics` with `registerFrontendTool`, `agentId: 'default'`,
   `parameters: z.object({})`, and an async handler returning
   `this.rooms().flatMap(room => room.metrics.map(({ id, name }) => ({ id, name, room: room.name })))`.
   Explain that the result gives exact IDs and names, plus the room for
   disambiguation. It contains no readings. Do not use the combined UI label
   as the metric name: the backend validates the original ID/name pair.
2. Import `registerHumanInTheLoop` from `@copilotkit/angular`,
   `alarmApprovalToolSchema` from `@packt-workshop/contracts`, and
   `AlarmApprovalCard` from `./alarm-approval-card`. Add the `raise_alarm`
   registration in `setupTools()`, using that schema as `parameters` and that
   card as `component`. Copy the completed registration from the Code changes section if needed.
   This registration omits agentId, making it available to all agents; this app
   currently has one agent, default. The existing constructor calls setupTools
   in Angular's injection context.
3. Show the prepared `alarmApprovalToolSchema`: the model supplies `metricId`,
   `metricName` and `reason`. There is no approve boolean in the model input.
   Show the prepared `AlarmApprovalCard`: no handler or template insertion is
   needed in App. The registration tells CopilotKit which component to render.
4. Create `apps/agent-service/src/mastra/prompts/webinar-06.ts` by copying its
   prepared contents from the presenter Code changes section. Explain only the additions:
   metric discovery, an explicit operator request before raise_alarm, human
   approval, authoritative rejection, and success only for an executed outcome.
   This prompt preserves the existing four tools and the absence of reactive
   context. Do not use main-06: it is the original historian prompt.
5. In `apps/agent-service/src/mastra/agents/main/agent.ts`, change the prompt
   import from `../../prompts/main-05` to `../../prompts/webinar-06`.
   Mastra's tools object stays empty: Angular supplies these client tools.
   No changes to app.config.ts, app.html, the runtime or the backend are needed.
6. Wait for Angular and Mastra to reload, then start a fresh Angular conversation.
   Clear old filters with the ordinary UI and use Snapshot. Before the successful
   approval demo, choose a metric without an active alarm. If your target already
   has one, use the existing manual controls to acknowledge/resolve it as needed.
   Selecting a checkpoint never resets alarm data or the audit.

## Demonstrate

1. **Show the AG-UI Chrome extension again.** Ask: **Which metrics are available
   in the Cooling room?** Inspect list_metrics and its returned IDs, names and
   rooms. The tool lists all rooms; the assistant selects the requested room
   from its result. It has not inspected temperature readings.
2. Ask: **Raise an alarm for the Cooling room air temperature because I observed
   a cooling failure.** Inspect the exact target and reason in the approval card.
   Before clicking, show that the proposal has not raised an alarm.
3. Click **Reject**. Show the audit entry with rejected and not-executed, and
   verify no alarm was created. The assistant should acknowledge the rejection
   and should not retry. Explain that rejection is a normal completed decision.
4. Send the same request again, then click **Approve and raise alarm**. Verify
   the alarm in Snapshot and the audit entry with approved, executed and an
   alarm ID. Check the actual outcome before accepting a textual success claim.
   If execution fails, explain the failure; do not present it as successful.
5. **Show Mastra Studio at http://localhost:4212.** Inspect the trace for the
   Angular request, including the tool call and returned decision. The Studio
   trace explains the agent run; the facility audit records the operator's
   decision and the execution outcome. Studio standalone chat does not host
   Angular's approval card.

## Explain the boundary

The prepared card generates the correlation ID in the browser. Its decision
handler calls POST /api/alarm-approvals with the proposal, decision and the demo
operator night-reception. The backend validates the metric ID/name and records
the decision and any alarm creation in a transaction. The card returns that
record through toolCall.respond(record); the existing subscription refreshes
Snapshot and the audit. A transport error leaves the card available to retry.

The model chooses a proposal, not a decision. It cannot approve on the operator's
behalf. It cannot read measurements yet, so the demo reason is an observation
supplied by the operator. Acknowledge and resolve remain manual controls.

## Transition

“We can now control the interface and propose an action with human approval.
Next, webinar 07 adds a bounded backend tool to query the historian. The approval
flow stays in place.”

## Recovery

Run `git switch webinar-06` to open the saved chapter. To rehearse its implementation, start from `git switch webinar-05`.
Before switching, commit rehearsal edits on your own practice branch or save
them with `git stash push -u -m "webinar rehearsal"`. Git can carry edits
between branches or refuse a switch; switching alone does not discard them.

Restart `pnpm dev:backend`, wait for Angular and Mastra to reload, and start
a fresh chat. Restart `pnpm webinar:notes` if the presenter was already running.
All eight branches contain the same complete notes, demo prompts and code
references. Switching branches does not reset stored readings or alarms.
