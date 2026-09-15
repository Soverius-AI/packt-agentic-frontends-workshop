# Agentic frontends — presenter starter

This is the Angular-only working branch for a **three-day, presenter-led workshop**.
Rainer writes the glue code; attendees follow the explanation and demonstrations.
It starts with the conventional app. Components, state, schemas, prompts, database,
SQL policy, and approval handling are already implemented.

**Start here:** [presenter guide](workshop/README.md) · [cue sheet](workshop/cue-sheet.md)
· [speaker notes](workshop/speaker-notes/01-conventional-app.md)
· [readiness and future work](workshop/readiness.md)

## Open your presenter notes

```sh
pnpm workshop:notes
```

Open http://localhost:4400 for the **Presenter desk**: one action at a time,
the next action, copyable demo prompts, exact file diffs and completed code, plus
recovery instructions. Arrow keys move between actions; your place is remembered
in the browser. The app and Mastra do not need to be running.

The Markdown notes and completed solutions remain the sources. This command
rebuilds the presenter data before starting a local notes server. Restart the
command after editing the notes, or run `pnpm workshop:notes:build` and reload.
`workshop/presenter.html` and `workshop/presenter-data.js` are also available to
open together directly from disk. They are committed with the repository.

Presenter navigation never switches the application's milestone or edits code.
Copy the code or checkpoint command when you decide to apply it.

## Run the starting state

Requirements: Node 24 or newer and pnpm 11. No model key is needed for milestone 01.

```sh
pnpm install
pnpm workshop:status
pnpm dev
```

Open http://localhost:4300. The facility API uses port 3101. The prepared Mastra
service and Studio use port 4211. These defaults keep this worktree separate from
the original milestone development ports (4200, 3001, 4111).

For milestone 02 onward, copy `.env.example` to `.env` in this worktree and enter
your OpenRouter key. For milestones 04–07 also run `pnpm dev:agent` in another
terminal. `pnpm dev:all` starts all three services when the model is configured.
Each worktree owns its own ignored SQLite data directories and `.env`.

## Present or recover a checkpoint

```sh
pnpm workshop:select 05
pnpm workshop:status
```

The selector copies the seven files listed in `workshop/manifest.json`. It first
saves the previous contents under `.workshop-backups/`. It never changes Git
branches or deletes database records. Stop/restart `pnpm dev` after changing the
backend; start/restart `pnpm dev:agent` after changing the agent; reload the browser
to discard the previous conversation. Code checkpoint selection is not a database
or conversation reset.

The intended live workflow is to write/paste the small changes described in the
notes. The selector provides rehearsal starting points and recovery snapshots.

## Layout

| Location                       | Responsibility                                                |
| ------------------------------ | ------------------------------------------------------------- |
| `apps/angular-host`            | Prepared Angular UI and frontend tool connections             |
| `apps/facility-service`        | API, conventional app, SQLite, basic chat and Copilot runtime |
| `apps/agent-service`           | Mastra agents, prepared workflow steps, prompts and Studio    |
| `packages/contracts`           | Shared API, tool and result schemas                           |
| `workshop/solutions/01` … `07` | Copyable completed presenter files                            |
| `workshop/speaker-notes`       | What to say, open, change, demonstrate and inspect            |

## Verification

```sh
pnpm check:types
pnpm workshop:test
pnpm format:check
```

`pnpm check:types` builds contracts, the facility API and Angular, and checks
Mastra TypeScript. `pnpm build` additionally bundles Mastra/Studio. The local
regression test uses a temporary database and deterministic responses, without a
model call. See `workshop/readiness.md` for the actual verification performed.

## Scope and source

Based on completed `07-human-in-loop` (`e2e5d14`), with the basic chat and embedded
Copilot runtime restored from completed checkpoints 02 and 03. The numbered
reference branches remain separate. React is removed from this presenter branch;
shared contracts remain because both browser and servers consume them.

A2UI (08), A2A (09), and MCP/MCP Apps (10) are future additions. No uncommitted
A2UI code was copied from the original worktree. The existing blueprint and
`docs/step-*` files record the original checkpoint design; older three-hour and
two-framework descriptions are historical reference, not this presenter runbook.
