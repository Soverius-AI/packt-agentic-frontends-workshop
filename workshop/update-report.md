# Workshop refresh — 15 September 2026

## Subsequent Basic Chat teaching adjustment

BasicChatComponent now lives in Angular as prepared code. Milestone 02 activates
it, implements the OpenAI connection in `basic-chat-model.ts`, and enables the
chat endpoint: **3 presenter files, +21/−9 lines** relative to 01.
The manifest now tracks eight files. The measurements below describe the earlier
milestone refresh, before this presenter-requested adjustment.

## Findings and source

The local milestone branches contain the new work. A fresh GitHub PR listing and
remote fetch found only documentation PRs 1–4; the local 01–07 tips are ahead of
their published branches, and 08 has no published remote branch. This update uses
the local commits below. It does not publish, merge or rewrite numbered branches.

| Milestone | Local source          | Commit    |
| --------- | --------------------- | --------- |
| 01        | `01-base-app`         | `0be43f5` |
| 02        | `02-basic-chat`       | `1fc5573` |
| 03        | `03-copilotkit-ag-ui` | `21f370c` |
| 04        | `04-mastra-agent`     | `fa15643` |
| 05        | `05-frontend-tool`    | `734bef9` |
| 06        | `06-sql-tool`         | `2115c3d` |
| 07        | `07-human-in-loop`    | `5925974` |
| 08        | `08-a2ui`             | `9931134` |

The workshop previously already had the shortened basic/Mastra prompts introduced
on 02–05; comparing those strings found no additional prompt edits to bring over.
The new changes are the simplified database setup, exact filter IDs, direct
historian result delivery on 06–07, and milestone 08 A2UI composition.

## What changed

- Kept Angular as the only frontend. Moved the reference Lit catalogue and Table
  implementation into `apps/angular-host/src/app/a2ui`; no `facility-ui` package
  or React host/adapter was added. CopilotKit’s supplied renderer handles A2UI.
  SDKs can still bring React transitively; that is distinct from a React app.
- Kept schemas and dataset calculations in `packages/contracts`, since Angular,
  Mastra and the facility service consume them. Preserved the native chat schemas
  needed by milestone 02.
- Removed `show_historian_readings`. The prepared Angular UI now derives the
  fixed result from delivered tool messages. The model gets a receipt, and the
  bridge plus `ToolCallFilter` keep earlier query payloads out of later requests.
- Added the prepared composition workflow, result-format agent, catalogue and
  Generated view. SQL data travels with the result; no second data fetch is needed.
- Preserved the 06–07 reading policy separately in `historian-query-legacy.ts`.
  The 08 facility export selects the dataset policy explicitly. Average/count
  queries remain unsupported in the earlier fixed-grid lesson.
- Imported the simplified seed/reset implementation and strict discovered-ID
  validation. `pnpm reset:demo` is explicit: stop the app before deliberately
  refreshing seven-day readings and clearing demo alarms/audit. No existing
  database was reset during this update.
- Extended the selector, solutions, notes, cue sheet, presenter navigation and
  ordered demo prompts through 08. The same seven presenter file paths are used.

## Is there less live code?

Yes, modestly for the existing milestones. Milestone 06 needs only the agent
factory; its Angular connection is gone. The primary gain is one fewer model tool
call and no model-mediated copying of records. Prompt strings on 02–05 were already
shortened in Workshop. The earlier native-chat replacement remains a prepared
paste, not code to type from scratch.

The following compares each completed selection with its predecessor. Counts
include imports and formatting; they are review diffs, not estimates of typing time.
The old column refers to Workshop commit `e7ee45b`.

| Transition into | Previous workshop  | Updated workshop   |
| --------------- | ------------------ | ------------------ |
| 02              | 4 files · +224/−19 | 4 files · +224/−19 |
| 03              | 5 files · +39/−215 | 5 files · +39/−215 |
| 04              | 1 file · +2/−2     | 1 file · +2/−2     |
| 05              | 2 files · +5/−3    | 2 files · +5/−3    |
| 06              | 2 files · +6/−4    | 1 file · +6/−3     |
| 07              | 2 files · +8/−2    | 2 files · +3/−2    |
| 08              | —                  | 4 files · +16/−7   |

Milestone 08 is four edits: catalogue provider, chat notice, agent workflow/tool
selection, and facility policy export. Its components, schema validation and
workflow steps are prepared. The overall repository grows because these supporting
implementations and regression tests are now included; the table measures only
the presenter’s connection files.

## What to demonstrate

The manager prompt was clarified after a live run combined both rooms into one
table per manager. The instruction now explicitly asks for two separate room
tables inside each manager card. The clarified attempt still did not meet the
requested arrangement, so this example is explicitly marked for rehearsal.

The first three 08 prompts showcase a standalone table, manager Cards containing
room Tables, and room-description Cards without tables. Optional prompts revisit
the earlier aggregate limitation and explain the read-only boundary. Each prompt
has setup, expected behavior and evidence to inspect in [demo prompts](demo-prompts.md).
There are 24 ordered prompt entries across milestones 02–08; 01 is a manual tour.

## Verification

See the [current verification ledger](readiness.md). Reference-branch rehearsal
claims have not been copied over as new live-model verification of this worktree.
