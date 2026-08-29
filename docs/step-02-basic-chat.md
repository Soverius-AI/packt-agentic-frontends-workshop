# Step 2 implementation brief — Basic chat

## Objective

Extend the completed `01-base-app` checkpoint with an application-owned chat
that supports ordinary user/assistant conversation. This step deliberately
does not give the model access to facility data or application actions.

Create the runnable checkpoint as `02-basic-chat` directly from
`01-base-app`. Preserve `01-base-app` as the completed, independently runnable
starting point. Do not merge the checkpoint into `main`; create
`03-copilotkit-ag-ui` from the completed `02-basic-chat` milestone.

## Fixed decisions

- Implement the same chat capability in both the Angular and React hosts.
- Keep the model integration in the existing TypeScript Node backend.
- Use the official `openai` JavaScript/TypeScript SDK against OpenRouter's
  OpenAI-compatible endpoint.
- Use `OPENROUTER_API_KEY` only on the server.
- Make the model configurable through `OPENROUTER_MODEL`.
- Use `google/gemma-4-31b-it` as the workshop default and document how to
  override it.
- Start with a non-streaming request. Streaming is introduced with AG-UI in
  Step 3.
- Keep short-term conversation history in each frontend and send the relevant
  message list with every request. Do not add persistent conversation memory.

## Backend shape

Add an application endpoint such as `POST /api/chat` with a deliberately small
shared contract:

```ts
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequest = {
  messages: ChatMessage[];
};

type ChatResponse = {
  message: ChatMessage & { role: "assistant" };
};
```

The backend adds a minimal static system instruction, validates and limits the
incoming history, calls OpenRouter through the OpenAI SDK, and returns one
assistant message. It must produce a clear configuration error when the API
key is missing and must never return or log the key.

The system instruction may explain that the assistant is embedded in the
Soverius Chocolate Factory incident-management application and that users may
refer to its rooms, metrics, warnings, alarms, and history. It must not include
current readings, selected UI state, database records, or inferred facility
facts. This makes the assistant application-aware but data-blind.

## UI shape

Add a chat panel that fits alongside the incident-management table and works
at desktop and mobile widths. It needs:

- user and assistant messages;
- a text input and Send action;
- pending, empty, and error states;
- keyboard submission without preventing multiline input;
- an accessible conversation log and labelled controls; and
- equivalent behaviour in Angular and React.

The existing snapshot, reading log, filters, chart, continuous updates, and
alarm workflow must remain functional.

## Capability boundary

Step 2 contains no:

- tool definitions or tool-call handling;
- generated SQL or historian/database access;
- selected-room or selected-metric context injection;
- frontend actions;
- human approval or other human-in-the-loop flows;
- streaming;
- AG-UI, CopilotKit, or Mastra; or
- persistent conversation memory.

The system instruction should give the assistant only enough static context to
understand the fictional incident-management domain and make it honest about
this boundary. A question
such as "When did the Cooling room enter warning during the last seven days?"
must not be answered from invented data; the assistant should explain that it
cannot inspect the historian yet.

## Demonstration

1. Ask a general domain question, such as "What does a warning condition
   generally mean in an incident-management system?"
2. Exchange a follow-up message to demonstrate basic conversational context.
3. Ask when the Cooling room entered warning during the last seven days.
4. Show that the assistant cannot inspect the application's data.

That limitation motivates Step 3: replace the custom chat UI and transport
with CopilotKit, Copilot Runtime, and AG-UI streaming before adding tools.

## Completion criteria

- Angular and React both complete a basic multi-turn conversation.
- The OpenRouter secret exists only in backend configuration.
- Missing configuration and provider failures are visible and recoverable.
- No facility state or database contents are sent to the model.
- No tool-call implementation exists.
- Existing Part 1 behaviour remains intact.
- Production builds pass for all workspace packages.

## Handoff prompt for a new Codex session

> Read `packt-copilotkit-workshop-blueprint.md`, `docs/checkpoints.md`, and
> `docs/step-02-basic-chat.md`. Preserve `01-base-app` as the completed
> checkpoint, create or continue `02-basic-chat`, and implement only the scope
> in the Step 2 brief. Do not add tool calling, SQL access, AG-UI, CopilotKit,
> or Mastra.
