# Part 3 / Checkpoint 03 — CopilotKit and AG-UI streaming

This branch extends the completed conventional application with the first AI
capability in the three-hour **Hands-On Agentic Frontends with AG-UI and
CopilotKit** workshop.

It replaces the Checkpoint 02 custom chat transport with CopilotKit's prebuilt
chat, Copilot Runtime, a tool-free BuiltInAgent, and AG-UI streaming. A minimal
system prompt still tells Gemma 4 which application it is embedded in, but the
model receives no facility state and has no application capabilities.

## Scenario

Soverius Chocolate has two adjacent production areas: a climate-controlled **Cooling room** and the **Packaging hall**. During the previous days, cooling-room air temperature enters warning at 12:00 and returns to normal at 14:00. On the current day, it enters warning at 12:00 and stays there. Humidity moves between normal and warning; the other simulated metrics remain normal. The connecting door must be checked manually because it has no sensor.

A person on night duty can inspect seven days of stored telemetry, use the continuously updated snapshot, raise an alarm for any metric, and acknowledge or resolve it. In snapshot mode, individual devices report at randomized intervals and every new reading is persisted. The application cannot interpret the combined evidence and recommend checking the connecting door before calling maintenance.

The assistant can understand what a user means by the Cooling room, but it
cannot answer when that room entered warning because it cannot inspect the
historian. The standardized agent path is now ready for Mastra in Checkpoint 04.

## What this checkpoint adds

- CopilotKit's prebuilt inline chat in Angular 22 and React 19;
- Copilot Runtime mounted at `/api/copilotkit` in the existing Node service;
- one tool-free BuiltInAgent named `default`;
- AG-UI run lifecycle, text streaming, cancellation, and terminal errors;
- `@ai-sdk/openai` pointed at OpenRouter;
- `google/gemma-4-31b-it` as the configurable default model;
- a direct Angular component integration with scoped layout and
  streaming-scroll compatibility, plus a lazy React chat boundary; and
- agent discovery plus backend and frontend tests.

The conventional SQLite application remains intact. This checkpoint does
**not** contain tools, SQL generation, facility-state injection, persistent
chat memory, human approval, Mastra, A2UI, A2A, MCP, or an MCP App.

## Run it

Requirements: Node 24 LTS or newer and pnpm 11.

Copy `.env.example` to `.env` and replace the placeholder with an OpenRouter
API key. `OPENROUTER_MODEL` is optional and defaults to
`google/gemma-4-31b-it`.

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts the facility backend and Angular host together. To use React instead, run `pnpm dev:backend` and `pnpm dev:react` in separate terminals.

Default URLs:

| Host    | URL                     |
| ------- | ----------------------- |
| Angular | `http://localhost:4200` |
| React   | `http://localhost:5173` |
| API     | `http://localhost:3001` |

The live stream is available at `GET /api/metric-updates`. The UI only subscribes while **Continuous updates** is enabled; the backend continues recording simulated device readings in SQLite.

CopilotKit agent discovery is available at `GET /api/copilotkit/info`. In the
React host, the CopilotKit Inspector appears automatically on localhost; in
either host, the browser network panel exposes AG-UI lifecycle and text events.

Build and test the checkpoint with:

```bash
pnpm check
```

## Teaching point

> AG-UI standardizes a streaming agent interaction without giving the agent
> application data or tools.

Checkpoint 04 replaces BuiltInAgent with Mastra without rewriting either
CopilotKit frontend or changing the chat-only capability boundary.
The overall route is documented in [docs/checkpoints.md](./docs/checkpoints.md).
