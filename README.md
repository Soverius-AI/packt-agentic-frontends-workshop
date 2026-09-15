# Webinar starting state — webinar-00

This separate branch preserves Rainer's working Basic Chat implementation and
prepares the supporting code before the webinar. The live exercise changes only:

1. `apps/angular-host/src/app/app.html`: activate `<app-basic-chat />`.
2. `apps/facility-service/src/chat.ts`: implement `createChatClient` with the OpenAI SDK.
3. `apps/facility-service/src/main.ts`: connect that client to the facility service.

The BasicChatComponent, both Angular imports, frontend response adapter, system
prompt, environment loading, assertion helpers, dependencies and server route are
prepared. The starter has a typed factory placeholder and disconnected chat.

## Start here

Use the **packt-webinar-zero** directory and branch **webinar-00**. Its `.env` is
private and ignored; configure OPENROUTER_API_KEY and OPENROUTER_MODEL before
starting the backend. Those settings are checked even in state 00.

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
pnpm webinar:select 00
pnpm webinar:select 02
```

Open http://localhost:4400. The sidebar identifies branch `webinar-00`. The
presenter desk includes the three exact code changes, demo prompts and recovery.
`00` is the starting state; `02` is the completed Basic Chat exercise. Selection
backs up only the three live files into ignored `.webinar-backups/` and applies
the chosen version. Restart the backend and refresh the app after selection.
It does not reset the database or change Git branches.

- [Starting-state speaker notes](webinar/speaker-notes/00-start.md)
- [Basic Chat speaker notes](webinar/speaker-notes/02-basic-chat.md)
- [Demo prompts](webinar/demo-prompts.md)
- [Verification](webinar/verification.md)

The familiar `workshop:notes`, `workshop:select`, `workshop:status`, and
`workshop:test` commands are aliases for this branch's webinar commands.
The inherited `workshop/` files and existing milestone branches are unchanged
reference material. The webinar selector currently supports 00 and 02 only;
it does not apply the old milestone implementations over this backend.

## Verify

```sh
pnpm webinar:test
pnpm --filter angular-host build
```

The tests use the actual completed webinar factory with a mocked OpenAI response,
exercise the backend route and Angular response contract, preserve conventional
facility checks, and verify the three-file selector and presenter data. They make
no external model calls. Angular builds are also checked for both webinar states.
