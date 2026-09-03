# Step 7 implementation brief — human approval and correlated audit

## Objective

Add one consequential agent-proposed action without giving the model execution
authority. The assistant may prepare a request to raise an alarm for one exact
metric. CopilotKit pauses the AG-UI run and renders an approval card. A named
operator approves or rejects the proposal, and the facility service records the
decision and actual outcome before the agent continues.

Create `07-human-in-loop` directly from the completed `06-sql-tool`
checkpoint. Preserve all earlier milestones and create `08-a2ui` directly from
this checkpoint.

## Fixed decisions

- Keep every frontend and historian capability from Step 6.
- Add exactly one human-in-the-loop tool:

  ```text
  review_alarm({ metricId, metricName, reason })
  ```

- The agent must resolve the exact metric through `list_metrics` and may call
  `review_alarm` only after an explicit operator request to raise an alarm.
- The model proposes; it never approves, rejects, or executes.
- The approval card identifies the metric, reason, and operator and provides
  explicit **Reject** and **Approve and raise alarm** controls.
- Rejection is an authoritative result. The agent must not retry or route
  around it.
- Keep the existing conventional manual raise, acknowledge, and resolve
  controls. Agent-driven acknowledgement and resolution remain out of scope.
- Generate the correlation ID in the browser approval boundary, not in model
  output.
- Validate the metric ID/name pair in the facility service.
- Persist the operator decision and, on approval, the alarm creation in one
  SQLite transaction. Store the actual outcome as `executed`, `not-executed`,
  or `failed`.
- Treat repeated identical correlation IDs idempotently and reject attempts to
  reuse a correlation ID for different decision data.
- Show the durable decision audit in both hosts. Mastra traces remain
  operational observability; the facility audit is the accountability record.
- Keep A2UI, A2A, MCP, and MCP Apps out of this checkpoint.

## Request flow

```text
Angular :4200 or React :5173
  -> operator explicitly asks to raise an alarm
  -> default Mastra agent uses list_metrics to resolve the target
  -> default agent calls review_alarm with the exact metric and reason
  -> CopilotKit pauses the AG-UI run and renders the host approval card
  -> operator approves or rejects as night-reception
  -> host calls POST /api/alarm-approvals on facility service :3001
  -> facility service validates the proposal and correlation ID
  -> one SQLite transaction records the decision and conditionally raises the alarm
  -> the structured decision and outcome resume the AG-UI run
  -> dashboard and durable audit trail refresh in the host
```

No additional process or port is introduced. The facility SQLite database owns
both alarms and approval audit records.

## Demonstration

1. Ask: **Raise an alarm for the Cooling room air temperature because it has
   remained in warning.**
2. Confirm that the agent resolves the metric and displays an approval card
   instead of changing facility data.
3. Reject the proposal. Confirm that no alarm appears and the audit records the
   rejection with `not-executed` outcome and a correlation ID.
4. Repeat the request and approve it. Confirm that the alarm appears in the
   existing Snapshot table and the audit records `approved` plus `executed` and
   the created alarm ID.
5. Compare the Mastra trace with the facility audit: the trace explains the
   agent run; the audit establishes operator accountability and the real
   mutation outcome.
6. Motivate Checkpoint 08: the behaviour can now be dynamic and consequential,
   but result presentation is still entirely predetermined.

## Completion criteria

- `07-human-in-loop` is based directly on `06-sql-tool`.
- Both Angular and React register the same `review_alarm` schema through
  CopilotKit's human-in-the-loop API.
- The approval UI is keyboard accessible, exposes explicit decision labels,
  and never executes while arguments are incomplete.
- Every successful operator click resolves the paused tool call, including
  rejection.
- Rejection persists an audit entry and performs no alarm mutation.
- Approval and alarm creation commit atomically in facility SQLite.
- The facility boundary validates the metric ID/name pair and existing alarm
  state rather than trusting model output.
- The audit records correlation ID, action, target, reason, operator, decision,
  timestamp, outcome, alarm ID, and error.
- Identical retries with the same correlation ID return the existing record;
  conflicting reuse is rejected.
- The visible dashboard and audit trail refresh after a decision.
- Existing manual alarm controls and all Step 6 capabilities still work.
- Service, agent, Angular, and React production builds and `pnpm check` pass.
- Reject and approve flows are verified through the rendered UI.
