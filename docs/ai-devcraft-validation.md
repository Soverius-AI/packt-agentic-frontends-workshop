# AI DevCraft chapter 3 validation — 29 September 2026

Branch `ai-devcraft/03-agentic-ui` includes the latest chapter 2 baseline, `db7d404`, through merge `eae9da7`. The SQL generation, deterministic preflight, Jev review and complete-column result contract are retained.

## Automated checks

- Shared contracts, facility service, Mastra production bundle and Angular production build passed.
- 39 agent-service tests, 18 Angular tests and 13 facility demo/policy tests passed.
- Angular ESLint/Sheriff and Git whitespace checks passed.
- Approval tests cover approve/reject, pending-click protection, HTTP retry, stable identity across card remounts, invalid proposal dismissal and focus restoration.
- The HTTP boundary test uses an isolated in-memory database: invalid/mismatched proposals, rejection, approval, replay, conflicting decisions, already-active alarms and replay after resolution. A replay does not recreate an alarm.

## Live browser rehearsal

- CopilotKit chat: “Show the highest air temperature for each shift manager.” returned three complete readings in the table and a completed activity card.
- Packaging hall → Air temperature: the approval card identified the room and metric and waited for a human.
- Reject recorded an audit entry, created no alarm and resumed the assistant conversation.
- A new proposal was approved. Exactly one alarm was added (active count changed from one to two); the audit showed the approved/executed result and the chat resumed.
- A missing chat-configuration provider was found during this rehearsal and fixed. Correlation now uses the available message/tool-call identity. The corrected card was exercised in the live app.

## Review

Separate standards and specification reviews found ambiguous room identification, lost focus, invalid proposals leaving the conversation waiting, and unstable retry identity. These were fixed. The final standards follow-up found no new actionable issues.

The rehearsal leaves its demo alarm and audit in the local database. Resolve the Packaging hall demo alarm through the normal UI before repeating the approval demo; retain the audit. Model wording and generated SQL can vary.

These are local checks, not hosted CI or a full accessibility audit. The fixed workshop operator is not production authentication. The standalone presenter desk remains exclusively on branch `ai-devcraft/00-start`.

## Workflow-owned activity update

- Each workflow step emits progress through Mastra's writer. The tool uses `run.stream()` and forwards only the typed progress events. The runtime maps these to AG-UI activity snapshots on one card per workflow run.
- Deterministic preflight and Jev review each pause for two seconds after publishing their activity. These are explicit presentation delays, not measured computation time.
- 41 agent-service tests passed, including event order, both delay durations, streamed rejection and unchanged SQL safety gates. Four facility tests passed, including custom-event forwarding, isolation between runs and the existing approval HTTP boundary.
- Contracts, facility and Angular builds passed. Mastra production packaging passed with network access after its sandboxed dependency installation failed. Agent TypeScript checking passed.
- Live browser: observed Generating SQL → Checking SQL deterministically → Reviewing SQL with Jev → Validating and executing → Complete. The visible check states lasted about 2.18 s and 2.15 s respectively; the final result contained three complete readings.

## Four-step progress bar

The workflow supplies 0/25/50/75/100 percent. Rejection and failure retain the last successful-step percentage. The Angular card uses a labelled native progress element and visible percentage. Targeted streaming/percentage tests and facility HTTP tests passed; contracts/facility builds, agent type checking, Angular production build and lint passed.

Live browser verification: observed 0%, 25% and 50% during the workflow, then 100% with three complete historian readings. The 50% card was visually inspected. The fast 75% transition is covered by the streaming event-order test.
