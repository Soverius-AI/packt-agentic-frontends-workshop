# Presenter guide

## Delivery contract

This is a three-day workshop with presenter coding. There are no participant
exercises or required student submissions. Day boundaries and time allocations
are deliberately open: milestones 1–7 are the ready content to build on while
A2UI and later topics are still being developed.

For each milestone: demonstrate the current limitation, explain the missing
connection, inspect the contract, make the connection, run it, and trace the result.
Type short decisions live. Paste repetitive wiring and long prompts. Explain the
reason for a change before scrolling through implementation details.

## Before the session

1. Use this worktree, not the original `08-a2ui` worktree. Run `pnpm install`.
2. Put your model key into this worktree's `.env` and keep that file off screen.
3. Rehearse with `pnpm workshop:select 01`, then `pnpm dev`.
4. Confirm the conventional UI at port 4300, snapshot, filters, history, and manual
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
  `main-07.ts`; select the appropriate import in the agent factory.
- SQL generator and reviewer: `apps/agent-service/src/mastra/prompts/sql-generator.ts`
  and `sql-reviewer.ts`.
- Questions you type into the app: the **Demonstrate** section of each notes file.

## Restart and recovery

Angular reloads frontend edits. The facility service runs compiled JavaScript:
after a backend change, stop and restart `pnpm dev` so it rebuilds. Mastra changes
can reload in dev mode; for a reliable milestone transition restart its terminal
and refresh Studio. Reload the browser after each capability change.

For a complete code checkpoint use `pnpm workshop:select NN`. The command tells
you where it backed up your presenter files. Do not use a Git reset during a talk.
If a provider fails, open the small connection and trace its intended flow; be
explicit that the live request failed. There is no fabricated model-response demo.
