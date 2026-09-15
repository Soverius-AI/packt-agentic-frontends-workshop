# 02 — Implement and connect Basic Chat

**Start branch:** `webinar-01` in `packt-webinar-zero`.
**Completed branch:** `webinar-02` (end of chapter 2).
The `packt-webinar-02` worktree now uses branch `webinar-04`; select state 02
there to rehearse this chapter without switching branches.
**In-place recovery:** `pnpm webinar:select 02`; this copies files, not branches.
The component, Angular imports, API response adapter, environment setup, types,
assertion helpers and system prompt are prepared. The live work is three files.

## Say

“This assistant receives our static instructions and the conversation. It has no
connection to current facility readings, filters or actions.”

## Open and change

1. In `apps/angular-host/src/app/app.html`, replace `<app-chat />` with
   `<app-basic-chat />`. BasicChatComponent is already in App's imports; no change
   to `app.ts` or `chat.component.ts` is needed. Show the prepared component's
   `send()` only to explain the request path; do not rewrite the form.
2. In `apps/facility-service/src/chat.ts`, implement `createChatClient` using the
   existing imports, parameters and ChatService return type. Create `new OpenAI`
   with `apiKey` and `baseURL: 'https://openrouter.ai/api/v1'`. Return an object with
   an async `reply(messages)` method. Call `client.chat.completions.create` with
   the configured model and `[{ role: 'system', content: CHAT_SYSTEM_PROMPT }, ...messages]`.
   Read the first choice with `getOrThrow(completions.choices[0])` and return
   `{ ...message, content: message.content ?? '' }`.
   [Completed factory](../solutions/02/apps/facility-service/src/chat.ts).
   Explain that the OpenAI SDK uses OpenRouter's compatible endpoint. Show the
   prepared prompt in `prompts/basic-chat.ts`; keep the key off screen.
3. In `apps/facility-service/src/main.ts`, replace `chat: undefined` with
   `chat: createChatClient(OPENROUTER_API_KEY, OPENROUTER_MODEL)`.
   [Completed integration](../solutions/02/apps/facility-service/src/main.ts).
   The environment values and factory import are already prepared.
4. Show the prepared `/api/chat` handler in `server.ts`: validate the incoming
   messages, call `chat.reply`, return the assistant message. Show
   `basic-chat/chat-api.ts` wrapping that message for the existing Angular UI:
   `chatResponseSchema.parse({ message: response })`.
5. Stop and rerun your backend launcher: `pnpm dev:backend`, `pnpm dev`, or
   `pnpm dev:all`, whichever you started. The backend runs compiled JavaScript;
   saving TypeScript alone does not reload it. Refresh the app for a fresh conversation.

## Demonstrate

1. Ask: **Why does temperature control matter when making chocolate?**
   Show `POST /api/chat` in the Network panel. Expect an assistant message with
   `role` and `content`; the response is not streamed.
2. Ask: **What is the current air temperature in our Cooling room?**
   Expect the assistant to acknowledge its missing access. Compare with the
   Snapshot. An invented or guessed value is not evidence of data access.

## Transition

“The model can converse. Its next capabilities will need explicit connections.”
The next chapter will start from `webinar-02` and end at `webinar-03`.
`webinar-03` and `webinar-04` are prepared. Branches `webinar-05` through `webinar-08` will be created
as we prepare those chapters. The selector currently supports 01, 02, 03 and 04. Existing milestone
branches and their solutions remain separate.

## Recovery

Run `pnpm webinar:select 02`, restart the backend launcher and reload the app.
It restores the complete chapter 2 checkpoint, including its native chat endpoint. Before another rehearsal,
`pnpm webinar:select 01` restores the starting state. No database reset is involved.
For an error, first check the terminal build result and `/api/chat` response. A
working dashboard does not prove that the model call succeeded.
