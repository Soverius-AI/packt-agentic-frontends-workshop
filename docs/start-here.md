# AI DevCraft — start here

Branch `ai-devcraft/00-start` contains the working chapter 2 backend demo and its presenter guide. It includes SQL generation, the deterministic preflight, Jev review and protected historian execution. It has no CopilotKit or AG-UI integration.

## Create the second checkout during the presentation

In a terminal in the original incident-management repository, run:

```sh
git worktree add ../incident-management-live ai-devcraft/00-start
cd ../incident-management-live
code .
pnpm install
cp .env.example .env
```

Set `OPENROUTER_API_KEY` in this checkout's `.env` privately, before sharing the editor again. The key is not committed. For a rehearsed demo, prepare this configuration before the talk rather than entering credentials on screen.

The original folder stays on its existing branch. The new folder is checked out on `ai-devcraft/00-start`, with separate working files, dependencies and local databases; both folders share Git history. This is a second working checkout, not a separate clone.

Show `git worktree list` to make the two folders and branches visible. Open `docs/presenter-notes.md` in the new VS Code window.

## Run the demo

Stop the existing demo with Ctrl+C in the terminal running it. Both checkouts use the same ports; run only one at a time.

From the new checkout:

```sh
pnpm dev
```

Open:

- Angular: http://localhost:4300
- Mastra Studio: http://localhost:4211
- Facility health check: http://localhost:3101/api/health

The local databases are created for this checkout. Existing Mastra runs from the original checkout are not copied. Rehearse both prompts here if you want fallback runs available in this Studio instance.

## Present chapter 2

Follow [Presenter notes](presenter-notes.md): first the workflow composition and three Jev checks, then the rejected email request and successful highest-temperature request. The guide specifies what to type, which code to open and which outputs to show.

## Reuse a rehearsal checkout

If `../incident-management-live` already exists, open it and check its branch instead of repeating `git worktree add`. Do not delete a checkout that contains work. If branch 00 is already checked out elsewhere, `git worktree list` shows its location.

To return to the original demo, stop the app in this checkout, return to the original folder and run `pnpm dev` there.
