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

| Service                              | Address                   |
| ------------------------------------ | ------------------------- |
| Workshop app (Angular)               | http://localhost:4200     |
| Facility backend and Copilot runtime | http://localhost:3101     |
| Mastra API                           | http://localhost:4211/api |
| Mastra Studio                        | http://localhost:4212     |
| Presenter notes                      | http://localhost:4400     |

## Startup commands

Run these from the repository root. Use one terminal per service, or use
`pnpm dev:all` in one terminal. Stop existing service terminals before switching
to `dev:all`, so each port has only one owner. Ctrl+C stops the launched processes.

| Command            | Starts                             | Address                   |
| ------------------ | ---------------------------------- | ------------------------- |
| `pnpm dev:angular` | Angular only                       | http://localhost:4200     |
| `pnpm dev:backend` | Facility backend / Copilot runtime | http://localhost:3101     |
| `pnpm dev:mastra`  | Mastra API in watch mode           | http://localhost:4211/api |
| `pnpm dev:studio`  | Standalone Mastra Studio           | http://localhost:4212     |
| `pnpm dev:all`     | All four above                     | All four ports above      |

Studio connects to the API at 4211: start `dev:mastra` as well to use agents and
workflows. Mastra dev also includes a Studio page at 4211; the dedicated Studio
command uses 4212 and does not start another API server.

The service commands build their required shared contracts before starting.
`dev:all` builds contracts and the backend once, then starts all four processes.
`pnpm dev` remains a shortcut for Angular plus backend (milestones 01–03), and
`pnpm dev:agent` remains an alias for `pnpm dev:mastra`.
The presenter desk is separate: `pnpm workshop:notes` at http://localhost:4400.

For milestone 02 onward, copy `.env.example` to `.env` in this worktree and enter
your OpenRouter key. For milestones 04–08 also run `pnpm dev:mastra` and
`pnpm dev:studio` in separate terminals, or replace all service terminals with
`pnpm dev:all` when the model is configured.
Each worktree owns its own ignored SQLite data directories and `.env`.

## Present or recover a checkpoint

```sh
pnpm workshop:select 05
pnpm workshop:status
```

The selector copies the seven files listed in `workshop/manifest.json`. It first
saves the previous contents under `.workshop-backups/`. It never changes Git
branches or deletes database records. Stop/restart `pnpm dev` after changing the
backend (or restart `pnpm dev:backend` / `pnpm dev:all` if used); Mastra automatically
reloads agent edits in development mode. Wait for it to be ready, then reload the
browser to discard the previous conversation. See the presenter guide for
[reload and recovery details](workshop/README.md#restart-and-recovery). Code checkpoint selection is not a database
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
| `workshop/solutions/01` … `08` | Copyable completed presenter files                            |
| `workshop/speaker-notes`       | What to say, open, change, demonstrate and inspect            |

## Verification

```sh
pnpm check:types
pnpm workshop:test
pnpm workshop:test:a2ui
pnpm format:check
```

`pnpm check:types` builds contracts, the facility API and Angular, and checks
Mastra TypeScript. `pnpm build` additionally bundles Mastra/Studio. The local
regression test uses a temporary database and deterministic responses, without a
model call. See `workshop/readiness.md` for the actual verification performed.

## Scope and source

Updated from the local milestone branches 01–08; exact source commits are recorded
in `workshop/manifest.json`. See the [update report](workshop/update-report.md) for
what changed, what is smaller, and which checks passed. The numbered reference
branches remain separate. Angular owns the prepared A2UI catalogue and components;
shared contracts remain because the browser and servers consume them.

A2A (09) and MCP/MCP Apps (10) remain future additions. The `docs/step-*` files and
older three-hour/two-framework plans are reference history; use `workshop/` for
this three-day presenter runbook and current ports.

To refresh stale demo data, stop the app and deliberately run `pnpm reset:demo`.
It reseeds the last seven days and clears demo alarms and approval records. It is
separate from selecting a code checkpoint.
