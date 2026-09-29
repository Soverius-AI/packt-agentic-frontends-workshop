# AI DevCraft — presenter desk and demo setup

Murat, start here. This branch, `ai-devcraft/00-start`, contains the presenter website, instructions and reference code. Keep it open while running the application in a second worktree.

| Branch | Purpose |
| --- | --- |
| `ai-devcraft/00-start` | Presenter desk only; no application or API key required |
| `ai-devcraft/02-backend-agents` | Angular + Mastra, dynamic SQL, deterministic checks and Jev review; no CopilotKit or AG-UI |
| `ai-devcraft/03-agentic-ui` | CopilotKit/AG-UI, activity progress and human approval |

Branch 03 includes the latest chapter 02 Jev workflow and complete result columns. Desk sections 00–07 cover chapter 2; sections 08–13 cover chapter 3. There is no branch 01 here; agentic coding is a separate example.

## 1. Get the presenter desk

You need Git and Node.js. The demo was checked with Node.js 24.16.0; use Node 24. The application also uses pnpm 11.19.0 and an OpenRouter API key with access to the configured generation model and Jev.

Clone the repository with all its remote branches available:

```sh
git clone --branch ai-devcraft/00-start https://github.com/Soverius-AI/packt-agentic-frontends-workshop.git ai-devcraft-desk
cd ai-devcraft-desk
node presenter/serve.mjs
```

Open **http://localhost:4410**. No dependency installation or API key is needed for the desk. Leave this terminal running.

Use the left menu to select a section. Previous/Next and the arrow keys move through its actions. The desk shows what to say, which code to open, what to demonstrate, and the expected results. Commands and prompts have copy buttons. Your place is remembered in the browser.

If you already have the repository, run `git fetch origin` and check out `ai-devcraft/00-start` in a free, clean checkout instead of cloning again. Do not use `--single-branch`: the demo needs the branch 02 remote reference as well.

## 2. Create the application worktree

Open a second terminal in `ai-devcraft-desk` and run:

```sh
git fetch origin
git worktree add --no-track -b ai-devcraft/live-demo ../incident-management-live origin/ai-devcraft/02-backend-agents
cd ../incident-management-live
```

This gives you two working folders sharing one Git history:

- `ai-devcraft-desk`: presenter website on branch 00.
- `incident-management-live`: runnable chapter 2 app on your local `ai-devcraft/live-demo` branch.

Open `incident-management-live` in VS Code (`code .` if the command is installed). Code paths in the walkthrough refer to this application folder.

If the rehearsal folder or live-demo branch already exists, inspect `git worktree list` and reuse the existing checkout. Do not repeat the creation command or delete a folder containing changes.

## 3. Configure and run the app

In `incident-management-live`:

```sh
# Install this version if pnpm is not already available:
npm install --global pnpm@11.19.0
pnpm install
# Only on the first setup, when .env does not exist:
cp .env.example .env
```

Edit `.env` and replace the placeholder in `OPENROUTER_API_KEY` with your own key. Keep the other supplied settings for the first rehearsal. SQL generation uses `OPENROUTER_MODEL` (default `google/gemma-4-31b-it`); Jev uses `typesafe/jev-1.13` through the same OpenRouter key. No separate TypeSafe key is needed. Keep `.env` private and off screen.

Stop any other demo already using ports 4300, 3101 or 4211, then run:

```sh
pnpm dev
```

| Page | URL |
| --- | --- |
| Presenter desk | http://localhost:4410 |
| Angular application | http://localhost:4300 |
| Mastra Studio | http://localhost:4211 |
| Facility health check | http://localhost:3101/api/health |

Each worktree creates its own local databases and Studio history. Existing runs from Rainer's checkout are not included. Both application chapters use the same ports, so run only one app at a time. The presenter desk stays running separately.

## 4. Rehearse chapter 2

In Angular, enter each prompt in **Your question** and click **Find readings**. Expand **Query and review**, then inspect the matching input/run of `historianQueryWorkflow` in Mastra Studio.

1. **Rejected request:** `Show the email address of each shift manager.` The verified run passed the deterministic check, then Jev rejected the intent check. Final result: `status: rejected`, `stage: reviewer`; no database execution. Studio can still show the overall run as successful because rejection is a handled result.
2. **Successful request:** `Show the highest air temperature for each shift manager.` The verified seeded-data run returned three complete readings, one per manager, including date/time, room, metric, value and condition. Show approval, execution and the resulting Angular table.

The model can generate different SQL between runs. Inspect the actual output and rehearse both prompts before the talk. Keep those Studio runs available as a fallback. The presenter desk contains the code walkthrough and the output to show at each step.

## 5. Rehearse chapter 3

Stop the app with Ctrl+C. From the application worktree, start a separate local branch for chapter 3:

```sh
git fetch origin
git switch --no-track -c ai-devcraft/live-ui origin/ai-devcraft/03-agentic-ui
pnpm install
pnpm dev
```

On later rehearsals, use `git switch ai-devcraft/live-ui` instead of creating it again. To return to chapter 2, stop the app, run `git switch ai-devcraft/live-demo`, reinstall dependencies and restart. Save your changes before switching. The ignored `.env` and databases stay with the application worktree.

Start with desk section 08. In chat, repeat the successful SQL question, show its activity and populated table, then demonstrate changing the view with frontend tools. For human approval, use:

> Raise an alarm for the Packaging hall air temperature because I want the operator to investigate.

Pause at the approval card. Reject first and show the audit and resumed chat. Request a new proposal, approve it and show one alarm raised plus the audit. Check the metric is not already raised before rehearsal; resolve your prior demo alarm through the normal UI if needed. Do not delete the audit. Sections 09, 10, 11 and 13 include the code walkthrough.

The alarm flow uses a fixed demo operator. It demonstrates approval and audited execution, not production authentication.

## Updating the presenter notes

- `presenter/guide.json`: sections, presenter actions, commands and prompts.
- `presenter/code-examples.json`: reference code from the recorded branch 02 and 03 commits; this is documentation, not a runnable application.
- `presenter/index.html`: presenter layout and Soverius AI branding.

Restart `node presenter/serve.mjs` after editing, then reload the browser. The server rebuilds its generated data and serves only the page, data and logo. The printable reference is [docs/presenter-notes.md](docs/presenter-notes.md).
