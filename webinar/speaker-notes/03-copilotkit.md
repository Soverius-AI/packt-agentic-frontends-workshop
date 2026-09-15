# 03 — Replace Basic Chat with CopilotKit and AG-UI

**Start branch:** `webinar-02`. **Completed branch:** `webinar-03`.
**Current worktree:** `packt-webinar-02` now has branch `webinar-04` checked out; select 03 to rehearse this chapter.
**Recovery:** `pnpm webinar:select 03`, then restart the backend launcher.
The `.chat-container` styles, packages, system prompt and Angular proxy are prepared.
The CSS is committed in both webinar-01 and webinar-02; do not write CSS live.

## Say

“In chapter 2 we assembled the conversation and handled the model response ourselves.
Now we configure an agent and connect CopilotKit. It handles the conversation and
streams the response through AG-UI. The model still has no tools or facility data.”

## Open and change

1. In `apps/angular-host/src/app/app.ts`, import `CopilotChat` from
   `@copilotkit/angular` and put it in the component imports. Remove the inactive
   `ChatComponent` and `BasicChatComponent` imports. Their component files remain.
2. In `apps/angular-host/src/app/app.html`, replace `<app-basic-chat />` with
   `<div class="chat-container"><copilot-chat agentId="default" /></div>`.
   Keep the CopilotChat directly in App. Explain that the wrapper gives the chat
   its own height; the CSS was prepared earlier.
3. In `apps/angular-host/src/app/app.config.ts`, import `provideCopilotKit` and add
   `provideCopilotKit({ runtimeUrl: '/api/copilotkit' })` to the providers.
   This URL connects the Angular chat to the facility backend through the proxy.
4. Replace `apps/facility-service/src/chat.ts` with
   `apps/facility-service/src/create-copilot-runtime.ts`. The saved implementation
   retains the function name `createChatClient(apiKey, model)`, but now returns a
   Node HTTP listener. Create the OpenRouter provider with `createOpenAI` from
   `@ai-sdk/openai`, using the existing API key and OpenRouter base URL.
5. In that factory, create a `CopilotRuntime` with `agents.default` containing a
   `BuiltInAgent`. Pass `model: openRouterProvider(model)` and
   `prompt: CHAT_SYSTEM_PROMPT`. Show `prompts/basic-chat.ts`: this is the same
   static prompt as chapter 2. The `default` key matches the template's agentId.
6. Return `createCopilotNodeListener({ runtime: runtime, cors: false })`.
   CopilotKit now handles the run protocol and streamed response. The old
   `chat.completions.create` call and manual assistant-message mapping are gone.
   Remove the unused prepared `embedded-copilot-runtime.ts`; this chapter uses
   the factory you wrote. The saved file still contains the old ChatService types
   and unused imports; these are remnants, not additional CopilotKit requirements.
7. In `apps/facility-service/src/main.ts`, import the factory from
   `./create-copilot-runtime.js` and pass
   `copilotRuntime: createChatClient(OPENROUTER_API_KEY, OPENROUTER_MODEL)` to
   `createFacilityServer` in place of `chat`.
8. In `apps/facility-service/src/server.ts`, make `copilotRuntime` required and
   forward `/api/copilotkit` requests to it. Remove the old `/api/chat` handler,
   its request schema import and the `chat` option. Redirect the remaining
   ChatServiceError import to your new file. In `workshop-types.ts`, redirect
   its ChatService type import too; this is compatibility cleanup, not a new feature.
9. Stop and rerun the backend launcher (`pnpm dev:backend`, `pnpm dev`, or
   `pnpm dev:all`, whichever you started). Saving backend TypeScript alone does
   not rebuild or restart it. Reload Angular at http://localhost:4200.

## Demonstrate

1. **Show the AG-UI Chrome extension again.** Open its panel in Chrome DevTools
   before sending the first prompt. Keep the event stream visible and explain
   run-start, text-message content and run-finish events as the answer arrives.
   This is a required demonstration, not an optional debugging step.
2. Ask: **Why does temperature control matter when making chocolate?**
   Show incremental text and inspect the `/api/copilotkit` streaming response.
   Explain run-start, text-message and run-finish events. Streaming is observable
   protocol activity, not a view into hidden reasoning.
3. Ask: **Show only warnings from the Cooling room.**
   The filters should remain unchanged. The assistant has no tools and does not
   receive current application data. Compare its words with the actual view.

## Transition

“The frontend connection is now in place. In chapter 4 we will move the agent into
Mastra while keeping the CopilotKit chat interface.”

## Recovery

Run `pnpm webinar:select 03`, restart the backend launcher and reload Angular.
Check http://localhost:3101/api/copilotkit/info for the `default` agent.
A 404 from `/api/chat` is expected in chapter 3: that endpoint was removed.
Mastra is not needed for this chapter. Keep credentials off screen.
The selector restores all eleven checkpoint paths, including the empty Mastra starting state, including file creation and
removal. It backs up current files and records which paths were absent.
To rehearse the previous chapter in this worktree, select 02 and restart the backend;
select 03 to return. These commands change files, not the checked-out Git branch.
