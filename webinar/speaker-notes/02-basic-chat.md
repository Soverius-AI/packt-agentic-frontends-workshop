# 02 — Implement and connect Basic Chat

**Start branch:** `webinar-01` in `packt-webinar-02`.
**Completed branch:** `webinar-02` (end of chapter 2).
**Completed checkpoint:** `git switch webinar-02`. Rehearse from `webinar-01`.
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
`webinar-03` through `webinar-08` are prepared. Switch between the eight webinar branches in the same directory. Existing milestone
branches and their solutions remain separate.

## Recovery

Run `git switch webinar-02` to open the saved chapter. To rehearse its implementation, start from `git switch webinar-01`.
Before switching, commit rehearsal edits on your own practice branch or save
them with `git stash push -u -m "webinar rehearsal"`. Git can carry edits
between branches or refuse a switch; switching alone does not discard them.

Restart `pnpm dev:backend`, wait for Angular and Mastra to reload, and start
a fresh chat. Restart `pnpm webinar:notes` if the presenter was already running.
All eight branches contain the same complete notes, demo prompts and code
references. Switching branches does not reset stored readings or alarms.
