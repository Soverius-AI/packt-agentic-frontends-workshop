# Presenter guide

## Open your presenter notes

```sh
pnpm workshop:notes
```

Open http://localhost:4400 for the **Presenter desk**: one action at a time,
the next action, ordered demo prompts with setup and expected results, exact file diffs and completed code, plus
recovery instructions. Arrow keys move between actions; your place is remembered
in the browser. The app and Mastra do not need to be running.

The Markdown notes, `demo-prompts.json` and completed solutions remain the sources. This command
rebuilds the presenter data before starting a local notes server. Restart the
command after editing the notes, or run `pnpm workshop:notes:build` and reload.
`workshop/presenter.html` and `workshop/presenter-data.js` are also available to
open together directly from disk. They are committed with the repository.

Presenter navigation never switches the application's milestone or edits code.
Copy the code or checkpoint command when you decide to apply it.

## Workshop ports

| Service                            | Address                   |
| ---------------------------------- | ------------------------- |
| Angular app                        | http://localhost:4200     |
| Facility backend / Copilot runtime | http://localhost:3101     |
| Mastra API                         | http://localhost:4211/api |
| Mastra Studio                      | http://localhost:4211     |
| Presenter notes                    | http://localhost:4400     |

Mastra and Studio use the same server and port. Start them with `pnpm dev:agent`
from milestone 04 onward.

## Delivery contract

This is a three-day workshop with presenter coding. There are no participant
exercises or required student submissions. Day boundaries and time allocations
are deliberately open: milestones 1–8 are prepared, including A2UI.
A2A and MCP remain later additions.

For each milestone: demonstrate the current limitation, explain the missing
connection, inspect the contract, make the connection, run it, and trace the result.
Type short decisions live. Paste repetitive wiring and long prompts. Explain the
reason for a change before scrolling through implementation details.

## Before the session

1. Use this worktree, not the original `08-a2ui` worktree. Run `pnpm install`.
2. Put your model key into this worktree's `.env` and keep that file off screen.
3. Rehearse with `pnpm workshop:select 01`, then `pnpm dev`.
4. Confirm the conventional UI at port 4200, snapshot, filters, history, and manual
   alarm actions. Confirm a fresh conversation after each checkpoint transition.
5. Start `pnpm dev:agent` for milestone 04 and check Studio at port 4211.
6. Rehearse all model prompts with the configured model. Model responses and SQL
   choices are not deterministic; expected behavior in the notes is an acceptance
   criterion, not a claim that a particular live response has already been observed.
7. Keep the [cue sheet](cue-sheet.md), current notes, and matching
   `solutions/NN` directory available. Resolve any previously raised demo alarm
   through the conventional controls before the approval demonstration.

## The editable files

| File                                                 | When you teach it                                     |
| ---------------------------------------------------- | ----------------------------------------------------- |
| `apps/angular-host/src/app/chat/chat.component.*`    | 02: native chat; 03: CopilotChat replacement          |
| `apps/angular-host/src/app/app.config.ts`            | 03: CopilotKit provider and endpoint                  |
| `apps/facility-service/src/workshop.ts`              | 02: basic chat; 03: embedded agent; 04: Mastra bridge |
| `apps/agent-service/src/mastra/agents/main/agent.ts` | 04: agent; 05–07: instructions and capabilities       |
| `apps/angular-host/src/app/workshop/connect.ts`      | 05: UI tools; 06: results; 07: approval               |

The seven manifest entries include three chat files. Other files are prepared
supporting code; you can open them to explain the implementation. If you edit
those during a demonstration, save them yourself: checkpoint selection only backs
up and replaces the manifest files.

## See exactly what changes

```sh
git diff --no-index workshop/solutions/04 workshop/solutions/05
```

Exit code 1 means the directories differ, as expected. Each notes file links to
the previous and completed code. Copy a whole file for recovery or just the
relevant lines for live coding. The solutions contain the actual files, not
pseudocode, and stay outside the application compiler roots.

## Prompt locations

- Basic chat and embedded agent: `apps/facility-service/src/prompts/basic-chat.ts`.
- Main Mastra agent: `apps/agent-service/src/mastra/prompts/main-04.ts` through
  `main-08.ts`; select the appropriate import in the agent factory.
- A2UI format/composer and SQL instructions: prepared agent files under
  `apps/agent-service/src/mastra/workflows/historian-composition/agents/`.
- SQL generator and reviewer: `apps/agent-service/src/mastra/prompts/sql-generator.ts`
  and `sql-reviewer.ts`.
- Questions you type into the app: [demo prompt sequence](demo-prompts.md), also shown in the Presenter desk. Each includes setup, expected behavior and what to inspect. Follow the numbered order; optional prompts are marked.
- Edit `workshop/demo-prompts.json` to change that sequence, then run `pnpm workshop:notes:build`. This updates both the readable catalogue and the presenter data. The **Demonstrate** sections in the speaker notes give the surrounding teaching script.

## A2UI and preparation changes

Milestone 08 needs four presenter files: the catalogue provider, chat notice,
agent factory, and facility policy export. Table/Card/Text components and the
main-area renderer are already in Angular. The shared contract package stays
because both server services consume its schemas and dataset calculations.

Milestone 06 now changes only the agent factory: results arrive directly in the
prepared UI, and the model sees a completion receipt. The former display tool is
gone. See [update report](update-report.md) for source commits and the measured
change count.

If the seven-day data is stale, stop the app and run `pnpm reset:demo` deliberately.
This refreshes readings and clears alarms and approval records in this worktree’s
configured demo database. Code checkpoint selection does not reset data.

## Restart and recovery

Angular reloads frontend edits. The facility service runs compiled JavaScript:
after a backend change, stop and restart `pnpm dev` so it rebuilds. Mastra changes
can reload in dev mode; for a reliable milestone transition restart its terminal
and refresh Studio. Reload the browser after each capability change.

For a complete code checkpoint use `pnpm workshop:select NN`. The command tells
you where it backed up your presenter files. Do not use a Git reset during a talk.
If a provider fails, open the small connection and trace its intended flow; be
explicit that the live request failed. There is no fabricated model-response demo.
