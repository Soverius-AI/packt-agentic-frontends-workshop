# Webinar — chapter branches

The checkpoints preserve the presenter’s cumulative implementation. Chapter 2
connects the prepared Basic Chat component to a hand-written model call. Chapter 3
introduces CopilotChat and AG-UI. Chapter 4 moves the agent into Mastra and shows
Mastra Studio. The agent still has no facility tools or live application data.

## Chapter checkpoints

| Branch       | Completed state                   | Local directory      |
| ------------ | --------------------------------- | -------------------- |
| `webinar-01` | Prepared starting point           | `packt-webinar-zero` |
| `webinar-02` | Basic Chat and backend connection | Git checkpoint       |
| `webinar-03` | CopilotKit and AG-UI              | Git checkpoint       |
| `webinar-04` | Mastra agent and Studio           | `packt-webinar-02`   |

The existing `packt-webinar-02` directory now has **webinar-04** checked out,
so your editor and terminals keep their paths. Each branch includes the earlier
chapters. Branches 05–08 will be created when those chapters are ready. The original
milestone branches remain separate and unchanged.

Chapter 4 changes four application files: Mastra’s `agent.ts` and `index.ts`, plus
the facility backend’s `create-copilot-runtime.ts` and `main.ts`. Angular stays as
it was in chapter 3. Commit `ed3982f` preserves the presenter’s code as written.
The factory includes a CommonJS-loading workaround for the installed adapter’s
`fast-json-patch` ESM incompatibility; see the chapter 4 notes.

## Start here

Use **packt-webinar-02**, branch **webinar-04**. Keep `OPENROUTER_API_KEY` and
`OPENROUTER_MODEL` in the private, ignored `.env`; Mastra reads them in chapter 4.

```sh
pnpm install --frozen-lockfile
pnpm webinar:status
pnpm dev:all
```

| Command              | Service                  | Port  |
| -------------------- | ------------------------ | ----- |
| `pnpm dev:angular`   | Angular                  | 4200  |
| `pnpm dev:backend`   | Facility backend         | 3101  |
| `pnpm dev:mastra`    | Mastra API               | 4211  |
| `pnpm dev:studio`    | Standalone Mastra Studio | 4212  |
| `pnpm dev:all`       | All four                 | Above |
| `pnpm webinar:notes` | Presenter desk           | 4400  |

Angular and Mastra watch source edits. After backend edits, stop and rerun its
launcher so TypeScript is rebuilt. Run services from only one worktree at a time:
the ports are shared. `pnpm dev` runs Angular and the backend only; chapter 4 also
needs Mastra, so use `pnpm dev:all` or start `pnpm dev:mastra` separately.

## Presenter notes and recovery

```sh
pnpm webinar:notes
pnpm webinar:select 01
pnpm webinar:select 02
pnpm webinar:select 03
pnpm webinar:select 04
```

Open http://localhost:4400. The presenter desk covers chapters 01–04 with exact
code differences, demo prompts and recovery commands. Chapter 3 explicitly reminds
you to show the AG-UI Chrome extension again. Chapter 4 requires showing Mastra
Studio, trying the agent there, and inspecting the trace from an Angular request.

The selector restores eleven paths, including the two Mastra entry files, and
backs up current files plus an absence list in ignored `.webinar-backups/`.
Selecting 03 empties the agent and restores `agents: {}`; selecting 04 restores
your implementation. It changes files, not Git branches or databases. Restart the
backend, wait for Mastra to reload, then reload Angular after selecting a state.

- [Starting-state speaker notes](webinar/speaker-notes/01-start.md)
- [Basic Chat speaker notes](webinar/speaker-notes/02-basic-chat.md)
- [CopilotKit speaker notes](webinar/speaker-notes/03-copilotkit.md)
- [Mastra speaker notes](webinar/speaker-notes/04-mastra.md)
- [Demo prompts](webinar/demo-prompts.md)
- [Verification](webinar/verification.md)

The `workshop:notes`, `workshop:select`, `workshop:status` and `workshop:test`
commands alias the webinar commands. Basic Chat API tests remain removed.

## Verify

```sh
pnpm webinar:test
pnpm --filter @packt-workshop/agent-service exec tsc --noEmit
```

The suite checks conventional facility behavior, Copilot listener forwarding,
real Mastra adapter discovery, presenter content and recovery between checkpoints.
It makes no model calls. The separate live chapter-4 streaming check and Studio
inspection are recorded in the verification notes.
