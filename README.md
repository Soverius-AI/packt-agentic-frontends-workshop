# Webinar — chapter branches

## Simplified baseline for milestone 5

The shared application methods and the four Angular-local schemas are prepared.
No frontend tools or agent context are registered on webinar-01 through webinar-04.
The presenter writes the context connection, two tool registrations and the Mastra
prompt change during milestone 5. See [the preparation and teaching guide](webinar/milestone-05.md).


The webinar branches preserve Rainer's working Basic Chat implementation and
prepare the supporting code before the webinar. The live exercise changes only:

1. `apps/angular-host/src/app/app.html`: activate `<app-basic-chat />`.
2. `apps/facility-service/src/chat.ts`: implement `createChatClient` with the OpenAI SDK.
3. `apps/facility-service/src/main.ts`: connect that client to the facility service.

The BasicChatComponent, both Angular imports, frontend response adapter, system
prompt, environment loading, assertion helpers, dependencies and server route are
prepared. The starter has a typed factory placeholder and disconnected chat.

## Chapter checkpoints

| Branch       | Completed state                                     | Local directory      |
| ------------ | --------------------------------------------------- | -------------------- |
| `webinar-01` | Prepared starting point                             | `packt-webinar-zero` |
| `webinar-02` | End of chapter 2: Basic Chat and backend connection | `packt-webinar-02`   |

`webinar-02` builds on `webinar-01`. The difference is exactly the three live
files listed above. Compare them with `git diff webinar-01..webinar-02`.
Your original working implementation is also preserved at commit `1a9e25e`.

Continue with `webinar-03` through `webinar-08` as those chapters are prepared.
Each future branch will include everything through its chapter; those branches
have not been created yet. Commits within a chapter can record teaching steps.
Existing milestone branches remain separate.

For chapter 2, present from `packt-webinar-zero` and keep `packt-webinar-02`
open as the completed reference. You can inspect both without switching branches.
Run application services from only one directory at a time because ports are shared.

## Start here

Use the **packt-webinar-zero** directory and branch **webinar-01**. Its `.env` is
private and ignored; configure OPENROUTER_API_KEY and OPENROUTER_MODEL before
starting the backend. Those settings are checked even in state 01.

```sh
pnpm install --frozen-lockfile
pnpm webinar:status
pnpm dev
```

| Command              | Service                  | Port  |
| -------------------- | ------------------------ | ----- |
| `pnpm dev:angular`   | Angular only             | 4200  |
| `pnpm dev:backend`   | Facility backend         | 3101  |
| `pnpm dev:mastra`    | Mastra API               | 4211  |
| `pnpm dev:studio`    | Standalone Mastra Studio | 4212  |
| `pnpm dev:all`       | All four                 | Above |
| `pnpm webinar:notes` | Presenter desk           | 4400  |

Mastra is preinstalled; the Basic Chat exercise uses OpenAI directly from the
facility backend. Angular and Mastra watch source edits. After backend edits,
stop and rerun the command that launched it so TypeScript is rebuilt.
Stop old worktree service terminals before starting this worktree on the same ports.

## Presenter notes and recovery

```sh
pnpm webinar:notes
pnpm webinar:select 01
pnpm webinar:select 02
```

Open http://localhost:4400. The sidebar identifies the chapter branches `webinar-01` and `webinar-02`. The
presenter desk includes the three exact code changes, demo prompts and recovery.
`01` is the starting state; `02` is the completed Basic Chat exercise. Selection
backs up only the three live files into ignored `.webinar-backups/` and applies
the chosen version. Restart the backend and refresh the app after selection.
It does not reset the database or change Git branches.

- [Starting-state speaker notes](webinar/speaker-notes/01-start.md)
- [Basic Chat speaker notes](webinar/speaker-notes/02-basic-chat.md)
- [Demo prompts](webinar/demo-prompts.md)
- [Verification](webinar/verification.md)

The familiar `workshop:notes`, `workshop:select`, `workshop:status`, and
`workshop:test` commands are aliases for this branch's webinar commands.
The inherited `workshop/` files and existing milestone branches are unchanged
reference material. The webinar selector currently supports 01 and 02 only;
it does not apply the old milestone implementations over this backend.

## Verify

```sh
pnpm webinar:test
pnpm --filter angular-host build
```

The tests cover conventional facility behavior, Copilot listener forwarding,
and presenter recovery. Basic Chat API tests have been removed from the webinar
branches. The checks make no external model calls.
