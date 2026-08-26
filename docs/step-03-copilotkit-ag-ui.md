# Step 3 implementation brief — CopilotKit and AG-UI

## Objective

Replace the application-owned chat UI and blocking `POST /api/chat` transport
from `02-basic-chat` with CopilotKit's prebuilt chat, Copilot Runtime, a
tool-free BuiltInAgent, and AG-UI streaming. Preserve the exact capability
boundary: the assistant can converse but cannot inspect facility data or
perform actions.

Create `03-copilotkit-ag-ui` directly from the completed `02-basic-chat`
checkpoint. Preserve both earlier milestones and create `04-mastra-agent`
directly from this checkpoint.

## Fixed decisions

- Keep equivalent runnable chat experiences in Angular and React.
- Use CopilotKit's prebuilt inline chat components in the existing two-column
  workspace.
- Mount Copilot Runtime in the existing TypeScript Node service under
  `/api/copilotkit`; do not introduce another backend server or framework.
- Register one tool-free `BuiltInAgent` named `default`.
- Keep Gemma 4 through OpenRouter and the existing server-only
  `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` configuration.
- Replace the `openai` SDK with `@ai-sdk/openai` as the OpenRouter-compatible
  model provider used by BuiltInAgent.
- Preserve the minimal static system prompt and its application-aware,
  data-blind boundary.
- Remove the custom `/api/chat` endpoint, frontend chat state, and shared chat
  request/response contract after CopilotKit parity is verified.
- Do not add Mastra until Step 4 and do not add tools until Step 5.

## Backend shape

Construct an OpenRouter provider with `createOpenAI`, pass the configured Gemma
model to `BuiltInAgent`, register it as `default` in `CopilotRuntime`, and mount
`createCopilotNodeListener` at `/api/copilotkit` within the existing Node HTTP
server.

The runtime owns agent discovery, run and thread identifiers, streaming,
cancellation, reconnection, and AG-UI lifecycle/text events. Existing facility
routes, SQLite access, telemetry, and alarm workflows remain conventional and
unchanged.

## Frontend shape

- Configure each host to use `/api/copilotkit`.
- Replace the custom chat component internals with CopilotKit's inline chat.
- Preserve the shared visual workspace and explicit notice that chat cannot
  access current application data.
- Import CopilotKit's supported stylesheet and keep keyboard, accessibility,
  scrolling, pending, and error behaviour provided by the component.
- Show streaming text and use the Inspector or network stream to make AG-UI
  run lifecycle events visible during the workshop.

## Capability boundary

Step 3 contains no:

- facility-state or selected-view context injection;
- historian/database tools or generated SQL;
- frontend actions;
- Mastra or another external agent framework;
- human approval; or
- persistent conversation memory.

The same historian-specific question from Step 2 must still be refused. The
new capability is standardized, streaming agent interaction—not application
data access.

## Demonstration

1. Repeat the Step 2 general-domain conversation in CopilotKit's chat.
2. Show the response streaming rather than arriving as one JSON payload.
3. Inspect agent discovery plus AG-UI run and text-message lifecycle events.
4. Ask when the Cooling room entered warning and show that the assistant still
   cannot inspect the historian.
5. Explain that Step 4 can replace BuiltInAgent with Mastra without rewriting
   the CopilotKit frontend.

## Completion criteria

- Angular and React both use CopilotKit chat against the same runtime.
- `/api/copilotkit/info` advertises the `default` agent.
- A run streams valid AG-UI lifecycle and text events.
- Cancellation and provider failure produce observable terminal states.
- OpenRouter credentials remain backend-only.
- The custom chat endpoint and duplicated frontend transport are removed.
- No application tools or facility data are sent to the model.
- Existing conventional application behaviour remains green.
- Backend, Angular, React, and production-build checks pass.

## Implemented checkpoint

The `03-copilotkit-ag-ui` branch implements this contract with CopilotKit
Runtime 1.69, CopilotKit Angular 0.3, and the v2 React frontend. Both hosts load
the rich chat renderer as a deferred feature so the conventional application
shell remains within its existing initial-build boundary. React exposes the
Inspector on localhost; both hosts expose the same AG-UI stream through the
shared runtime in the browser network panel.
