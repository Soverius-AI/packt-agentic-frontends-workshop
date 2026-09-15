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

1. `apps/facility-service/src/prompts/basic-chat.ts`: read the paragraph defining
   what the assistant cannot inspect. The prompt is prepared; do not type it.
2. `apps/facility-service/src/chat.ts`: show `client.chat.completions.create`, the
   system message, conversation messages, and the returned assistant message.
3. `apps/facility-service/src/workshop.ts`: import `createChatService` and replace
   `chat: undefined` with `chat: createChatService(options)`. Leave the Copilot
   runtime disconnected. [Exact file](../solutions/02/apps/facility-service/src/workshop.ts).
4. Paste the prepared native `chat.component.ts`, `.html`, and `.scss` from
   solution 02 into `apps/angular-host/src/app/chat/`. Briefly show `send()` calling
   `ChatApi.send(messages)`; the message list, form, loading and error UI are ready.
5. Open `chat/chat-api.ts`: point to `POST /api/chat`. Explain the request schema
   and response validation rather than the form implementation.
6. Restart `pnpm dev` to rebuild the server; reload the browser.

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

`pnpm workshop:select 02`, restart `pnpm dev`, reload the browser. On a provider
error, inspect the backend terminal and key configuration off screen. Successful
dashboard loading does not prove that a model request can succeed.
