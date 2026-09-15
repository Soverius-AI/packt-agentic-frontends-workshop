# 01 — Webinar starting state

**Branch:** `webinar-01`. **Folder:** `packt-webinar-zero`.
**Next checkpoint:** `webinar-02`, the end of chapter 2, in `packt-webinar-02`.
**Start:** `pnpm webinar:select 01`, then `pnpm dev`.
Open the Angular app at http://localhost:4200. Backend: http://localhost:3101.
This branch has its own private `.env`; keep it off screen. Its environment checks
require the configured key and model even before chat is connected.

## Say

“The facility application already works. We will add a conversation by connecting
an existing Angular component to a model through our backend.”

## Demonstrate

1. Show the Snapshot and Reading Log. The first loads `/api/dashboard`; the second
   loads `/api/readings` with filters. Explain that these are conventional API calls.
2. Show the chat placeholder. The basic chat component is already prepared in
   `apps/angular-host/src/app/basic-chat/`, including its API service and styles.
   Both chat components are imported in App. The live Angular change is one tag.
3. Open the three live files: `apps/angular-host/src/app/app.html`,
   `apps/facility-service/src/chat.ts` and `apps/facility-service/src/main.ts`.
   The model factory is a typed placeholder; the facility server has `chat: undefined`.
   The prepared `/api/chat` handler returns 404 until a client is connected.

## Transition

“The UI is ready. Next I will write the model connection and plug it into the server.”

## Recovery

Run `pnpm webinar:select 01`, restart the backend launcher and reload the app.
The selector backs up and replaces the checkpoint files. It never resets
readings or alarms. Existing milestone branches and `workshop/solutions` are separate.
