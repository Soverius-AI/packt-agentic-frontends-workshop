# Readiness and future additions

## Current scope

- Source: completed milestone 07, `e2e5d14`, with completed 02/03 adapters restored.
- Delivery: presenter-led three-day workshop. No participant exercises.
- Angular frontend only; shared contracts remain an internal workspace package.
- Completed presenter code selections: 01–07.
- Speaker notes, demo prompts and copyable solutions: 01–07.
- Default selection: 01, conventional app without AI setup.

## Verification ledger

Verified locally on 2026-09-15 with Node 26.7.0 and pnpm 11.19.0:

| Check                                                                            | Result                                                                                                 |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Angular production build, facility build, Mastra TypeScript for selections 01–07 | Passed for each selection                                                                              |
| Mastra/Studio bundle with starting selection 01                                  | Passed                                                                                                 |
| `pnpm workshop:test`                                                             | Passed: 6 scenarios plus parent test, temporary database, no model calls                               |
| `pnpm format:check` and `git diff --check`                                       | Passed                                                                                                 |
| Relative links in presenter Markdown                                             | All 10 files checked; no broken links                                                                  |
| Browser at :4300, selection 01                                                   | Snapshot data, reading log, Cooling room + Warning filtering and unconnected chat placeholder verified |
| Final presenter code selection                                                   | 01                                                                                                     |

The boundary tests cover unavailable/available chat transports, native-chat
validation and static context, filter patch preservation, complete historian rows,
rejected writes/aggregate shapes, and approval/rejection/replay audit behavior.
A discovered worker-start failure was fixed in this worktree: the compiled SQL
worker now receives a known source-map option instead of arbitrary parent-process
arguments, which Node's worker constructor can reject.

Live provider responses, end-to-end streamed tool calls, Studio traces from model
runs, and the approval card's complete conversational flow still need rehearsal
with a configured OpenRouter key. They are not implied by the tests above.
Inherited image-size warnings remain in the conventional UI; no new rendering
failure was observed. The project has not been newly audited for full accessibility
conformance in this pass.

## Add A2UI after its reference milestone is ready

1. Read the reviewed final 08 diff and its contract changes. Adapt the feature
   into this branch; do not merge a numbered reference branch wholesale.
2. Keep Angular-used components/catalogue/view state inside Angular. Retain
   schemas consumed by Mastra and the facility service in the shared package.
   Omit the React host and React catalogue adapter.
3. Preserve complete-reading workflow behavior in selections 01–07. If 08 changes
   the shared result contract or workflow, introduce an explicit prepared legacy
   adapter so selecting 06 still demonstrates its original fixed-grid limitation.
4. Add the A2UI view slot and catalogue connection, prepared composition prompts,
   and a completed solution 08. Extend the selector manifest if new teaching
   files are needed; provide defaults for all older selections.
5. Add speaker notes with a real transition from fixed readings to composed UI,
   a copyable demo, observable result, failure example, and recovery steps.
6. Verify the earlier selections still build and demonstrate their original
   capability boundaries. Rehearse the A2UI demo before marking it ready.

## Later topics

| Topic             | Status                                                      | Presenter connection to prepare                      |
| ----------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| 08 A2UI           | In development in separate reference worktree; not included | Catalogue + result renderer + composition workflow   |
| 09 A2A            | Planned                                                     | Coordinator-to-specialist call and visible trace     |
| 10 MCP / MCP Apps | Planned                                                     | Capability/resource connection and embedded app host |

Day allocation can be decided once this content is ready. Do not fill three days
with exercises or assume the original three-hour timing still applies.
