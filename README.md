# Webinar — chapter branches

## Chapter 7 in progress

The working branch is now `webinar-07` in `packt-webinar-02`. It starts from the
completed chapter 6 below. The historian prompt and [live implementation guide](webinar/milestone-07.md)
are prepared; the presenter still writes the workflow, tool and result-store
connections. See the [chapter 7 speaker walkthrough](webinar/speaker-notes/07-historian.md).
The completed presenter/recovery checkpoints remain 01–06 until those connections
are finished and verified. `pnpm webinar:select 07` is not available yet.

## Completed chapter 6

The presenter adds metric discovery and connects `raise_alarm` to the prepared
human-approval card. The operator approves or rejects the proposal; the backend
records the decision and actual outcome. The Mastra prompt matches the available
tools, with no historian access or reactive context. See [the chapter guide](webinar/milestone-06.md).

Earlier checkpoints retain Basic Chat (02), CopilotChat and AG-UI (03), the Mastra
agent and Studio (04), and four frontend tools (05). Original milestone branches
remain unchanged.

## Chapter checkpoints

| Branch       | Completed state                    | Local directory      |
| ------------ | ---------------------------------- | -------------------- |
| `webinar-01` | Prepared starting point            | `packt-webinar-zero` |
| `webinar-02` | Basic Chat and backend connection  | Git checkpoint       |
| `webinar-03` | CopilotKit and AG-UI               | Git checkpoint       |
| `webinar-04` | Mastra agent and Studio            | Git checkpoint       |
| `webinar-05` | Four frontend tools                | Git checkpoint       |
| `webinar-06` | Raise an alarm with human approval | `packt-webinar-02`   |

The existing `packt-webinar-02` directory has **webinar-07** checked out for preparation,
so your editor and terminals keep their paths. Each branch includes the earlier
chapters. Branch 07 is in progress; branch 08 will be created when that chapter is ready. The original
milestone branches remain separate and unchanged.

### Webinar order

| Webinar branch | Topic                                      | Original milestone |
| -------------- | ------------------------------------------ | ------------------ |
| `webinar-06`   | Raise an alarm with human approval         | `07-human-in-loop` |
| `webinar-07`   | Query the historian through a backend tool | `06-sql-tool`      |
| `webinar-08`   | A2UI                                       | `08-a2ui`          |

Chapter 6 starts from completed `webinar-05`. The approval card, input schema,
backend endpoint and audit display are already prepared. The presenter adds
`list_metrics`, registers `raise_alarm` with `registerHumanInTheLoop`, and
selects an adapted agent prompt. Metric discovery must return the exact metric
ID and name, with the room name for disambiguation. No historian query is needed:
the operator explicitly requests the alarm and supplies the reason, then approves
or rejects the proposal. The dedicated `webinar-06.ts` prompt matches our current tool names and does
not advertise historian access or reactive context.

Chapter 6 is saved locally. Chapter 7 then adds the historian while retaining
the approval flow; chapter 07 is in progress and chapter 08 remains planned.

Chapter 5 adds four registrations in `app.ts` and selects the prepared `main-05`
prompt in Mastra's `agent.ts`. The checkpoint also restores streaming-scroll
support in the chat template. The global SCSS fix is already on every webinar
branch. Input descriptions and prompt text are prepared support files.

## Start here

Use **packt-webinar-02**, branch **webinar-07**, starting from chapter-six behavior. Keep `OPENROUTER_API_KEY` and
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
pnpm webinar:select 05
pnpm webinar:select 06
```

Open http://localhost:4400. The presenter desk covers chapters 01–06 with exact
code differences, demo prompts and recovery commands. Chapter 3 explicitly reminds
you to show the AG-UI Chrome extension again. Chapter 4 requires showing Mastra
Studio, trying the agent there, and inspecting the trace from an Angular request.

The selector restores twelve paths, including the chapter-6 prompt file, and
backs up current files plus an absence list in ignored `.webinar-backups/`.
Selecting 03 empties the agent and restores `agents: {}`; selecting 04 restores
the chapter-4 implementation; selecting 05 restores the four frontend tools
and removes the chapter-6 prompt; selecting 06 restores metric discovery and
human approval. It changes files, not Git branches or databases. Restart the
backend, wait for Mastra to reload, then reload Angular after selecting a state.

- [Starting-state speaker notes](webinar/speaker-notes/01-start.md)
- [Basic Chat speaker notes](webinar/speaker-notes/02-basic-chat.md)
- [CopilotKit speaker notes](webinar/speaker-notes/03-copilotkit.md)
- [Mastra speaker notes](webinar/speaker-notes/04-mastra.md)
- [Frontend tools speaker notes](webinar/speaker-notes/05-frontend-tools.md)
- [Alarm approval speaker notes](webinar/speaker-notes/06-alarm-approval.md)
- [Chapter 6 verification](webinar/verification-06.md)
- [Demo prompts](webinar/demo-prompts.md)
- [Chapter 5 verification](webinar/verification-05.md)
- [Earlier chapter 4 verification](webinar/verification.md)

The `workshop:notes`, `workshop:select`, `workshop:status` and `workshop:test`
commands alias the webinar commands. Basic Chat API tests remain removed.

## Verify

```sh
pnpm webinar:test
pnpm --filter @packt-workshop/agent-service exec tsc --noEmit
```

The suite checks conventional facility behavior, Copilot listener forwarding,
real Mastra adapter discovery, frontend handler results, presenter content and recovery between checkpoints.
It makes no model calls. The separate live chapter-4 streaming check and Studio
inspection are recorded in the verification notes.
