# AI DevCraft presenter desk

This branch (`ai-devcraft/00-start`) contains only the presenter website, instructions and reference code. The applications live on `ai-devcraft/02-backend-agents` and `ai-devcraft/03-agentic-ui`.

## Open the desk

With Node.js installed, run:

```sh
node presenter/serve.mjs
```

Or run `pnpm presenter`. No dependency installation or API key is needed for the presenter desk. Open http://localhost:4410.

Use the sidebar and Previous/Next controls to follow the walkthrough. The arrow keys also move through actions, and your place is remembered. Code appears below the instructions; prompts and commands have copy buttons.

## Create the application checkout

In another terminal in this repository:

```sh
git worktree add -b ai-devcraft/live-demo ../incident-management-live ai-devcraft/02-backend-agents
cd ../incident-management-live
code .
pnpm install
# Only if .env is absent:
cp .env.example .env
```

Set OPENROUTER_API_KEY in the application's .env privately. Stop any demo already using ports 4300/3101/4211, then run `pnpm dev` in the application checkout. The desk keeps running separately on 4410.

Open Angular at http://localhost:4300 and Mastra Studio at http://localhost:4211. Follow the rejected email-address prompt, then the approved highest-temperature prompt in the desk. Each worktree has its own databases and Studio history.

If the rehearsal folder already exists, inspect `git worktree list` and reuse it rather than rerunning the creation command. The live-demo branch allows changes without modifying the chapter 2 checkpoint.

Chapter 3 is available on `ai-devcraft/03-agentic-ui`. Stop the app before switching checkpoints and reinstall dependencies after switching. Branch 03 is a separate committed checkpoint; it has not been updated with the latest Jev changes from branch 02.

## Edit the notes

- `presenter/guide.json`: sections, presenter actions, commands and prompts.
- `presenter/code-examples.json`: reference snippets captured from branch 02, with the source commit recorded. These are documentation, not a runnable app.
- `presenter/index.html`: the webinar presenter layout with the Soverius AI light palette and original logo.

Restart the desk after editing to regenerate `presenter-data.js`, then reload the browser. The website serves only its page, generated data and logo; it does not expose application files or environment variables.
