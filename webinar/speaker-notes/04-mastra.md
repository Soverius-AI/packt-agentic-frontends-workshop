# 04 — Move the agent into Mastra and show Studio

**Start branch:** `webinar-03`. **Completed branch:** `webinar-04`.
**Current worktree:** `packt-webinar-02`, branch `webinar-04`.
**Recovery:** `pnpm webinar:select 04`, restart the backend and reload Angular.
Mastra, its shared libraries, environment loading, storage, tracing and Studio CORS
are prepared. Start Angular on 4200, the facility backend on 3101, Mastra API on
4211 and Mastra Studio on 4212 with `pnpm dev:all`, or use the four individual scripts.
Before starting, stop any older instance using those ports.

## Say

“The Angular chat and AG-UI connection are already working. We now move the model
and instructions into a dedicated Mastra agent. The facility backend connects
CopilotKit to that agent. Studio lets us inspect and try the agent directly.”

## Open and change

1. Open `apps/agent-service/src/mastra/agents/main/agent.ts`. It is empty in
   webinar-03. Write `createAgent(apiKey: string, model: string)`. Import `Agent`
   from `@mastra/core/agent` and `createOpenAI` from `@ai-sdk/openai`.
2. Create the OpenRouter provider with the API key and
   `baseURL: 'https://openrouter.ai/api/v1'`. Return an `Agent` with `id: 'default'`,
   `name: 'Soverius Chocolate Factory'`, `model: openRouterProvider(model)`,
   `instructions: CHAT_SYSTEM_PROMPT` and `tools: {}`. Import the prepared prompt
   from `../../prompts/main-04`. Read its limits aloud: no live readings or tools.
3. Open `apps/agent-service/src/mastra/index.ts`. Import `createAgent`. After the
   prepared environment loader, read `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`
   with `getOrThrow` from `@packt-workshop/common/assert-defined` (no `.js` suffix).
   Register `agents: { default: createAgent(OPENROUTER_API_KEY, OPENROUTER_MODEL) }`.
   Keep the prepared server, CORS, storage and observability configuration.
4. **Show Mastra Studio now at http://localhost:4212.** This is a required part
   of the chapter. Select Soverius Chocolate Factory (`default`), show the model
   and instructions, and send the general-knowledge prompt directly in its chat.
   Explain that this reaches the Mastra agent without going through Angular.
5. Open `apps/facility-service/src/create-copilot-runtime.ts`. Keep the existing
   factory and listener. Replace the OpenRouter provider and BuiltInAgent with a
   `MastraClient` from `@mastra/client-js`, using `baseUrl: 'http://localhost:4211'`.
   Create a `MastraAgent` with `agent: mastraClient.getAgent('default')` and register
   it as `agents.default` in `CopilotRuntime`. The factory takes no arguments now.
6. Explain the installed adapter's compatibility workaround briefly. Its normal
   ESM import fails on a named `compare` export from `fast-json-patch`. Import
   `createRequire` from `node:module`, then use
   `const require = createRequire(import.meta.url);` and
   `const { MastraAgent } = require('@ag-ui/mastra') as typeof import('@ag-ui/mastra');`.
   This is package compatibility code, not part of the agent architecture. The
   saved implementation uses an `AbstractAgent` annotation and retains old unused
   imports and ChatService declarations; these are not new Mastra requirements.
7. In `apps/facility-service/src/main.ts`, pass `copilotRuntime: createChatClient()`.
   Remove the old backend model/key assertions: Mastra now reads these values.
   Keep the environment loader for the backend's own settings. Angular, its chat
   component, and the facility server's route forwarding need no changes.
8. Stop and rerun `pnpm dev:backend` (or the combined launcher you use). The backend
   executes compiled JavaScript and does not rebuild when you save TypeScript.
   Mastra watches its source and reloads automatically; wait for its ready message.
   Reload Angular and begin a fresh conversation.

## Demonstrate

1. In Angular at http://localhost:4200, ask: **Why does temperature control matter
   when making chocolate?** Show the streamed answer. Trace the path: CopilotChat
   → facility CopilotKit listener → Mastra agent → model. The visible chat is the
   same as chapter 3, while the model call now lives in Mastra.
2. **Return to Mastra Studio and show the trace for that Angular request.** Refresh
   the trace list if necessary. Open the recent agent run and show its input,
   model generation and output. The prepared observability exporter records these.
   If no trace appears yet, check the Mastra terminal and refresh; do not claim
   that an unrelated Studio-chat trace proves the Angular request worked.
3. Ask: **What is the current air temperature in our Cooling room?** The agent
   should explain that it cannot access current readings. Show `tools: {}` and
   compare with the real snapshot. Mastra hosting alone does not grant access to
   application data. Explain that frontend tools are the next chapter.

## Transition

“We have a separate agent service and can inspect it in Studio. Next we will give
that agent bounded tools to interact with the Angular application's view.”

## Recovery

Run `pnpm webinar:select 04`, restart the backend launcher, wait for Mastra to
reload, and reload Angular. Check http://localhost:3101/api/copilotkit/info and
http://localhost:4211/api/agents for `default`. Open Studio on 4212, not the API
port 4211. API CORS for Studio and common-library builds are already prepared.
Keep `.env` values and credentials off screen.
The selector covers eleven paths, including the two Mastra source files. Selecting
03 restores an empty agent file and `agents: {}`; selecting 04 restores this agent.
It backs up your current code but does not switch Git branches or reset databases.
