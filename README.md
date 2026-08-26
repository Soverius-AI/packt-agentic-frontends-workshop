# Part 2 / Checkpoint 02 — Basic application-aware chat

This branch extends the completed conventional application with the first AI
capability in the three-hour **Hands-On Agentic Frontends with AG-UI and
CopilotKit** workshop.

It adds an ordinary multi-turn conversation through Gemma 4 on OpenRouter. A
minimal system prompt tells the model which application it is embedded in, but
the model receives no facility state and has no application capabilities. The
goal is to make the difference between application context and application
access visible before introducing AG-UI.

## Scenario

Soverius Chocolate has two adjacent production areas: a climate-controlled **Cooling room** and the **Packaging hall**. During the previous days, cooling-room air temperature enters warning at 12:00 and returns to normal at 14:00. On the current day, it enters warning at 12:00 and stays there. Humidity moves between normal and warning; the other simulated metrics remain normal. The connecting door must be checked manually because it has no sensor.

A person on night duty can inspect seven days of stored telemetry, use the continuously updated snapshot, raise an alarm for any metric, and acknowledge or resolve it. In snapshot mode, individual devices report at randomized intervals and every new reading is persisted. The application cannot interpret the combined evidence and recommend checking the connecting door before calling maintenance.

The assistant can understand what a user means by the Cooling room, but it
cannot answer when that room entered warning because it cannot inspect the
historian. That missing capability motivates Checkpoint 03.

## What this checkpoint adds

- equivalent accessible chat panels in Angular 22 and React 19;
- one non-streaming `POST /api/chat` endpoint in the existing Node service;
- the official OpenAI SDK pointed at OpenRouter;
- `google/gemma-4-31b-it` as the configurable default model;
- browser-owned short-term conversation history; and
- shared validation plus backend and frontend tests.

The conventional SQLite application remains intact. This checkpoint does
**not** contain tools, SQL generation, facility-state injection, streaming,
persistent chat memory, human approval, CopilotKit, AG-UI, Mastra, A2UI, A2A,
MCP, or an MCP App.

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

Build and test the checkpoint with:

```bash
pnpm check
```

## Teaching point

> A model can understand the application's domain and maintain a conversation
> without being connected to the application's current data or actions.

Checkpoint 03 replaces this custom chat with CopilotKit's chat component,
Copilot Runtime, a tool-free BuiltInAgent, and AG-UI streaming. Checkpoint 04
then replaces BuiltInAgent with Mastra without changing the chat capability.
The overall route is documented in [docs/checkpoints.md](./docs/checkpoints.md).
