# 07 — Connect human approval and the decision audit

**Start:** completed 06. Ensure the demo metric has no active alarm; use the
conventional controls to acknowledge/resolve an existing one.
**Completed code:** [solution 07](../solutions/07/).

## Say

“The assistant can propose an alarm. The operator decides, and the facility service
records the actual outcome. A plausible model response is not authorization.”

## Open and change

1. In Angular's `workshop/connect.ts`, add `registerAlarmApproval()`.
2. In `prepared-tools.ts`, show the `registerHumanInTheLoop` call, shared schema,
   and `AlarmApprovalCard` reference. The complete component already exists.
3. In the Mastra agent factory, change the instruction import to `main-07`.
   Read its approval/rejection paragraph. No server-side alarm tool is added.
4. Open `alarm-approval-card.ts` and locate `decide()`: explain the facility API
   call, persisted outcome, and the response that allows the paused run to continue.
5. Briefly open `FacilityRepository.decideAlarmApproval` to explain its transaction
   and correlation ID. Implementation is prepared; do not type database code.
6. Restart Mastra if needed and reload the browser.

## Demonstrate: rejection first

Ask: **Raise an alarm for the Packaging hall package reject rate because I want it investigated.**

Wait for the approval card. Point to the exact metric, reason and named operator.
Click **Reject**. Show that no alarm was raised and that the audit records the
rejection with its correlation ID. The assistant should report rejection.

## Demonstrate: approval

Make the request again and click **Approve and raise alarm**. Confirm the actual
alarm in the conventional UI and the executed result in the audit. If execution
fails, distinguish approval from successful execution. Acknowledge and resolve
the demo alarm with the conventional controls when finished.

If explaining duplicate decisions, show that replaying the same correlation ID
does not create another alarm. Do not claim that every new conversational request
shares that ID; a new proposal is a new decision.

## Transition to future content

“We can select readings and request an approved action. Our result layout is still
fixed. A2UI will let the assistant compose a view from components we supply.”

Stop at this promise until reviewed milestone 08 is adapted. A2A and MCP/MCP Apps
remain later additions, not hidden capabilities in this starter.

## Recovery

Select 07, restart/reload. If no card appears, check the registration, metric
discovery and tool arguments. If saving a decision fails, inspect the facility
response; never report success based only on the model's acknowledgement.
