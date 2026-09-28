# AI DevCraft demo validation — 29 September 2026

## Chapter 2 baseline

Branch `ai-devcraft/02-backend-agents`, commit `146ad2e`.

- Shared contracts, facility service, Mastra production bundle and Angular production build passed.
- Formatting passed.
- Live Angular form: highest air temperature per shift manager returned three complete readings in the existing grid.
- Live unsupported average request was rejected by the reviewer.
- No CopilotKit application dependency/integration; no A2UI.

## Chapter 3 agentic UI

Branch `ai-devcraft/03-agentic-ui`, directly based on chapter 2.

- Shared contracts, facility service, Mastra production bundle and Angular production build passed.
- Formatting and whitespace checks passed.
- Three focused automated tests passed: actual query event progress; rejected/malformed/interrupted results; approval/rejection with idempotency and conflicting decisions. The approval test uses an in-memory database.
- Live CopilotKit chat: highest air temperature per shift manager returned three readings and displayed a completed activity card.
- Live unsupported average request displayed a stopped activity and reviewer rejection.
- Live frontend tools switched to Reading log and selected Cooling room.
- Live human approval: rejection displayed “Rejected · no alarm was raised” and an audit entry; a second proposal was approved, created one demo alarm and displayed the approval audit. The conversation resumed after both decisions.

The live rehearsal uses the local demo SQLite database, including its approval audit and one raised alarm. Reset the demo before presenting if you want a clean initial state. LLM timing and wording vary; no latency guarantee is implied.

These are local checks. No branch was pushed and no hosted CI was run. This record does not claim a full accessibility audit.
