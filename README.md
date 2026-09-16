# Webinar — chapter branches

## Completed chapter 8

All eight webinar checkpoints are saved. Chapter 8 connects the prepared A2UI
composition workflow, dataset historian service, runtime bridge and Angular catalog.
The workflow can render aggregate results and requested Table/Card/Text layouts.
Frontend tools and human approval remain available in the cumulative application.

The generated widget currently appears in both the main area and the chat. That
behavior is accepted for this webinar; suppressing the chat widget is deferred.

See the [implementation guide](webinar/milestone-08.md),
[speaker notes](webinar/speaker-notes/08-a2ui.md) and
[verification record](webinar/verification-08.md).

Earlier checkpoints retain Basic Chat (02), CopilotKit and AG-UI (03), Mastra and
Studio (04), frontend tools (05), alarm approval (06), and the fixed historian grid
(07). Original milestone branches remain unchanged.

## Chapter checkpoints

| Branch       | Completed state                    | Local directory      |
| ------------ | ---------------------------------- | -------------------- |
| `webinar-01` | Prepared starting point            | `packt-webinar-zero` |
| `webinar-02` | Basic Chat and backend connection  | Git checkpoint       |
| `webinar-03` | CopilotKit and AG-UI               | Git checkpoint       |
| `webinar-04` | Mastra agent and Studio            | Git checkpoint       |
| `webinar-05` | Four frontend tools                | Git checkpoint       |
| `webinar-06` | Raise an alarm with human approval | Git checkpoint       |
| `webinar-07` | Query the historian                | Git checkpoint       |
| `webinar-08` | Compose views with A2UI            | `packt-webinar-02`   |

The existing `packt-webinar-02` directory has **webinar-08** checked out,
so your editor and terminals keep their paths. Each branch includes the earlier
chapters. All eight webinar branches are complete. The original
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

Chapter 7 adds the historian while retaining the approval flow. Both chapters
are saved locally; chapter 08 adds A2UI composition.

Chapter 5 adds four registrations in `app.ts` and selects the prepared `main-05`
prompt in Mastra's `agent.ts`. The checkpoint also restores streaming-scroll
support in the chat template. The global SCSS fix is already on every webinar
branch. Input descriptions and prompt text are prepared support files.

## Start here

Use **packt-webinar-02**, branch **webinar-08**. Keep `OPENROUTER_API_KEY` and
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
pnpm webinar:select 07
pnpm webinar:select 08
```

Open http://localhost:4400. The presenter desk covers chapters 01–08 with exact
code differences, demo prompts and recovery commands. Chapter 3 explicitly reminds
you to show the AG-UI Chrome extension again. Chapter 4 requires showing Mastra
Studio, trying the agent there, and inspecting the trace from an Angular request.

The selector restores fourteen paths, including the chapter-6, chapter-7 and chapter-8 prompts, and
backs up current files plus an absence list in ignored `.webinar-backups/`.
Selecting 03 empties the agent and restores `agents: {}`; selecting 04 restores
the chapter-4 implementation; selecting 05 restores the four frontend tools
and removes the chapter-6 prompt; selecting 06 restores metric discovery and
human approval; selecting 07 also connects the historian workflow, tool and result
store; selecting 08 enables A2UI and the dataset backend. It changes files, not
Git branches or databases. Restart the
backend, wait for Mastra to reload, then reload Angular after selecting a state.

- [Starting-state speaker notes](webinar/speaker-notes/01-start.md)
- [Basic Chat speaker notes](webinar/speaker-notes/02-basic-chat.md)
- [CopilotKit speaker notes](webinar/speaker-notes/03-copilotkit.md)
- [Mastra speaker notes](webinar/speaker-notes/04-mastra.md)
- [Frontend tools speaker notes](webinar/speaker-notes/05-frontend-tools.md)
- [Alarm approval speaker notes](webinar/speaker-notes/06-alarm-approval.md)
- [Historian speaker notes](webinar/speaker-notes/07-historian.md)
- [A2UI speaker notes](webinar/speaker-notes/08-a2ui.md)
- [Chapter 8 verification](webinar/verification-08.md)
- [Chapter 7 verification](webinar/verification-07.md)
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
