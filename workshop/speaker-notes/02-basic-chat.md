# 02 — Connect a conversation

**Start:** completed 01. Configure `.env` privately before this section.
**Completed code:** [solution 02](../solutions/02/).

**Demo inputs:** Follow the numbered prompts for milestone 02 in the
[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts
in the Presenter desk. Each includes setup, expected results and what to show.

## Say

“The first connection carries messages to a model. It supplies a static application
description, but no live readings, current filters, database tools, or actions.”

## Open and change, in this order

1. Open `apps/angular-host/src/app/chat/basic-chat.component.ts`: this is the
   prepared `BasicChatComponent`. Its template, styles, message list, form and
   loading/error states are already part of Angular. Show `send()` calling
   `ChatApi.send(messages)`; do not copy or rewrite the component.
2. Activate it in `apps/angular-host/src/app/chat/chat.component.ts`: import
   `BasicChatComponent`, add `imports: [BasicChatComponent]`, replace `templateUrl`
   with `template: '<app-basic-chat />'`, and replace `styleUrl` with
   `styles: ':host { display: contents; }'`. The wrapper gives the prepared
   component the existing chat slot. [Exact activation file](../solutions/02/apps/angular-host/src/app/chat/chat.component.ts).
3. Open `apps/facility-service/src/prompts/basic-chat.ts`: read the static context
   and the limitation on access to live data. The prompt is prepared.
4. **Write the OpenAI connection live** in
   `apps/facility-service/src/basic-chat-model.ts`. Import `OpenAI` from `openai`,
   remove the leading underscores from the three parameters, and replace the
   placeholder body. Create `new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' })`,
   await `client.chat.completions.create({ model, messages: [...messages] })`,
   and return `completion.choices[0]?.message.content?.trim() ?? ''`.
   [Completed connection](../solutions/02/apps/facility-service/src/basic-chat-model.ts).
   Explain that this is the OpenAI SDK using OpenRouter's compatible endpoint;
   the configured model and key stay on the backend. Do not show the key.
5. Open `apps/facility-service/src/chat.ts`: show how the prepared service prepends
   the system prompt to the conversation, calls `completeBasicChat`, and returns
   an assistant message. Request validation and provider-error handling are prepared.
6. Enable the endpoint in `apps/facility-service/src/workshop.ts`: import
   `createChatService` and replace `chat: undefined` with
   `chat: createChatService(options)`. Leave the Copilot runtime disconnected.
   [Exact file](../solutions/02/apps/facility-service/src/workshop.ts).
7. Open `apps/angular-host/src/app/chat/chat-api.ts`: point to `POST /api/chat`.
   Trace the whole request: BasicChatComponent → ChatApi → backend chat service
   → the OpenAI SDK call you just wrote → assistant response.
8. Restart the backend launcher (`pnpm dev:backend`, `pnpm dev`, or `pnpm dev:all`,
   whichever you started) to compile your edits, then reload the browser.

## Demonstrate

Type: **Why does temperature control matter when making chocolate?**

Expected: an ordinary general-knowledge answer. Show the `/api/chat` request in
the browser Network panel; this response is not streamed.

Then type: **What is the current air temperature in our Cooling room?**

Expected: the assistant acknowledges that it cannot inspect current facility data.
If it invents a value, use that as a prompt-boundary failure and compare it with
the actual dashboard. Never describe a correct guess as data access.

## Transition

“Before connecting tools, we need a standardized way to represent an agent run.”

## Recovery

`pnpm workshop:select 02`, restart `pnpm dev` (or your `pnpm dev:backend` / `pnpm dev:all` launcher), reload the browser. On a provider
error, inspect the backend terminal and key configuration off screen. Successful
dashboard loading does not prove that a model request can succeed.
