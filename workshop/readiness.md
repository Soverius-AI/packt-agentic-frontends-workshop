# Workshop verification and remaining rehearsal

## Current scope

- Angular-only presenter workshop with completed code selections 01–08.
- Exact local reference commits are recorded in [manifest.json](manifest.json).
- Default selection is 01: conventional app without model setup.
- Seven presenter file paths; milestone 08 changes four of them.
- Eight speaker-note chapters, 85 action cards, 24 demo prompt entries, and exact
  completed-code diffs in the Presenter desk at http://localhost:4400.
- A2UI components live in Angular; shared schemas remain in the contract package.
- A2A (09) and MCP/MCP Apps (10) remain future additions.

Current ports: Angular **4200**, backend **3101**, Mastra API **4211**, Studio **4212**,
presenter notes **4400**.

## Startup and reload check — 2026-09-15

- Each of `dev:angular`, `dev:backend`, `dev:mastra`, and `dev:studio` started
  successfully on its documented port. Angular's `/api/health` proxy and the
  backend health endpoint both returned 200; the Mastra agent endpoint and
  standalone Studio also returned 200.
- `dev:all` launched all four processes after the shared builds. Ctrl+C released
  all four ports. The individual commands were then checked separately.
- Studio's served configuration targets `localhost:4211`, and the API allows
  requests from the Studio origin at `localhost:4212`.
- A temporary agent-name edit appeared in `/api/agents` without a manual restart.
  Restoring the original source triggered another automatic reload. The presenter
  files still match checkpoint 01. This check made no model calls.
- Startup/reload instructions and demo setup text were updated, presenter data
  regenerated (8 chapters, 85 actions), and changed-file formatting checked.

## Local checks — 15 September 2026

Node 26.7.0 and pnpm 11.19.0. The update used source commits through `9931134`;
see [the update report](update-report.md) for the complete branch comparison.

| Check                                                                 | Result                                                                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Angular production build, facility build, Mastra TypeScript for 01–08 | Passed for every selection                                                                                               |
| `pnpm workshop:test`                                                  | 7 server checks including parent, plus 3 direct-result/model-history checks passed                                       |
| `pnpm workshop:test:a2ui`                                             | 27 checks passed: dataset/SQL policy, composition, native bindings, workflow order and model-data separation             |
| Milestone 08 Mastra dev bundle and all three services                 | Started successfully on 4300 / 3101 / 4211 before the Angular port change                                                |
| Milestone 08 production Mastra/Studio bundle                          | Passed                                                                                                                   |
| Exact filter IDs and explicit reset                                   | Verified with temporary data; startup preserves alarms/audit and explicit reset reseeds readings and clears alarms/audit |
| Presenter data                                                        | Eight chapters, 24 prompts, exact solution copies and JavaScript syntax verified                                         |
| Presenter browser                                                     | 08 navigation, four code diffs, prompt setup and clipboard text verified                                                 |
| Formatting and whitespace                                             | Passed                                                                                                                   |

The server checks preserve native chat versus Copilot transport boundaries,
complete-reading results and aggregate/write rejection for 06, and rejection,
approval and duplicate-decision audit behavior for 07. The A2UI suite verifies
complete datasets and aggregates beyond page boundaries, query limits, no write
access, bound stored descriptions, both data/UI workflow branches, and exclusion
of result values from current and replayed model requests. Model tests use fixture
responses; they do not establish live instruction-following.

The earlier fixed-grid workflow and executor remain separate prepared modules.
Selecting 06 or 07 cannot silently pick up the 08 aggregate/data-shape policy.
Neither setup nor this update reset the existing workshop database. Live telemetry
continued recording normal simulated readings during browser checks.

## Live Angular rehearsal in this worktree

| Demo                          | Observed result                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Table only                    | Passed: 2,481 readings, Time / Temperature / Shift Manager columns, page 1 → page 2, no surrounding Card or explanatory Text       |
| Stored room descriptions      | Passed: two Cards with Text and no tables; displayed descriptions matched the facility API exactly                                 |
| Original manager-card prompt  | Did not meet the request: one table per manager combined the room data                                                             |
| Clarified manager-card prompt | Still did not meet the requested hierarchy: grouped/duplicated manager tables instead of distinct room tables inside manager Cards |

The manager example is marked **rehearse first** in the prompt list and notes.
The current code validates structure, bindings and data fields; it does not prove
that a valid composition satisfies every natural-language layout requirement.
Use a mismatch to teach review, or continue with the verified table and room-card
examples. Do not present an earlier successful view as a failed request’s answer.
The aggregate and read-only conversational prompts were not run live in this pass;
their underlying behavior is covered by deterministic tests.

The three-day teaching format remains presenter-led. No participant exercises or
new A2A/MCP behavior were introduced. The new chapter includes prompt setup,
expected results, files to open, four live edits, trace points and recovery steps.

## Remaining limits

Rehearse prompts with the intended model before the workshop, especially nested
layouts. Model output and response time vary. The 07 conversational approval card
was not newly rehearsed live; its facility transaction is covered by regression
checks. Mastra logged its existing code-defined-agent fallback and no-memory notices;
requests completed. Angular logged the inherited oversized-logo warning and Lit’s
development-mode notice. This pass is not a new full accessibility audit.

The local milestone changes have not been published by this update. Workshop is
committed locally, and the reference branches remain separate.
