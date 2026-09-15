# Webinar — chapter branches

## Simplified baseline for milestone 5

The shared application methods and the four Angular-local schemas are prepared.
No frontend tools or agent context are registered on webinar-01 through webinar-04.
The presenter writes the context connection, two tool registrations and the Mastra
prompt change during milestone 5. See [the preparation and teaching guide](webinar/milestone-05.md).


Chapter 2 connects the prepared Basic Chat component to a hand-written model call.
Chapter 3 replaces that connection with CopilotChat, a BuiltInAgent and the
CopilotKit runtime. The same system prompt is reused; no facility tools are connected.
The `.chat-container` styles are prepared in webinar-01 and webinar-02. During
chapter 3, only add its wrapper around the chat in app.html.

## Chapter checkpoints

| Branch       | Completed state                                     | Local directory      |
| ------------ | --------------------------------------------------- | -------------------- |
| `webinar-01` | Prepared starting point                             | `packt-webinar-zero` |
| `webinar-02` | End of chapter 2: Basic Chat and backend connection | Git checkpoint       |
| `webinar-03` | End of chapter 3: CopilotKit and AG-UI              | `packt-webinar-02`   |

`webinar-02` builds on `webinar-01`. The difference is exactly app.html, chat.ts and main.ts. Compare them with `git diff webinar-01..webinar-02`.
Your original working implementation is also preserved at commit `1a9e25e`.

Continue with `webinar-04` through `webinar-08` as those chapters are prepared.
Each future branch will include everything through its chapter; those branches
have not been created yet. Commits within a chapter can record teaching steps.
Existing milestone branches remain separate.

The existing `packt-webinar-02` directory now has `webinar-03` checked out, so
your editor and terminals keep their paths. The webinar-02 branch still points
to the completed Basic Chat checkpoint. Use `pnpm webinar:select 02` to rehearse
from that code in this worktree and `pnpm webinar:select 03` to restore chapter 3.
Run application services from only one directory at a time because ports are shared.

## Start here

For the completed chapter 3, use **packt-webinar-02**, branch **webinar-03**. Its `.env` is
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
pnpm webinar:select 03
```

Open http://localhost:4400. The presenter desk covers chapters 01, 02 and 03,
with exact code differences, deletion markers, demo prompts and recovery commands.
The selector restores nine checkpoint paths, including added and deleted files.
It backs up current files and an `absent.json` list into ignored `.webinar-backups/`.
Restart the backend and reload Angular after selecting a state. Git branches and
the demo database are not changed.

- [Starting-state speaker notes](webinar/speaker-notes/01-start.md)
- [Basic Chat speaker notes](webinar/speaker-notes/02-basic-chat.md)
- [CopilotKit speaker notes](webinar/speaker-notes/03-copilotkit.md)
- [Demo prompts](webinar/demo-prompts.md)
- [Verification](webinar/verification.md)

The familiar `workshop:notes`, `workshop:select`, `workshop:status`, and
`workshop:test` commands are aliases for this branch's webinar commands.
Existing milestone branches remain unchanged. The inherited workshop server test
now delegates to the maintained webinar checks. The selector supports 01, 02 and 03;
it does not apply the old milestone implementations over this backend.

## Verify

```sh
pnpm webinar:test
pnpm --filter angular-host build
```

The tests cover conventional facility behavior, Copilot listener forwarding and real chapter-3 agent discovery,
and presenter recovery. Basic Chat API tests have been removed from the webinar
branches. The checks make no external model calls.
