# Part 4 / Checkpoint 04 — Mastra behind CopilotKit and AG-UI

This branch extends the completed CopilotKit and AG-UI checkpoint in the
three-hour **Hands-On Agentic Frontends with AG-UI and CopilotKit** workshop.

It replaces Checkpoint 03's BuiltInAgent with a tool-free Mastra agent behind
the same Copilot Runtime and AG-UI endpoint. The Angular and React frontends do
not change. A minimal system prompt still tells Gemma 4 which application it is
embedded in, but the model receives no facility state and has no application
capabilities.

## Scenario

Soverius Chocolate has two adjacent production areas: a climate-controlled **Cooling room** and the **Packaging hall**. During the previous days, cooling-room air temperature enters warning at 12:00 and returns to normal at 14:00. On the current day, it enters warning at 12:00 and stays there. Humidity moves between normal and warning; the other simulated metrics remain normal. The connecting door must be checked manually because it has no sensor.

A person on night duty can inspect seven days of stored telemetry, use the continuously updated snapshot, raise an alarm for any metric, and acknowledge or resolve it. In snapshot mode, individual devices report at randomized intervals and every new reading is persisted. The application cannot interpret the combined evidence and recommend checking the connecting door before calling maintenance.

The assistant can understand what a user means by the Cooling room, but it
cannot answer when that room entered warning because it cannot inspect the
historian. The standardized Mastra path is now ready for its first application
capability in Checkpoint 05.

## What this checkpoint adds

- one tool-free Mastra agent exposed as `default` through Copilot Runtime;
- a local Mastra service with Studio and persisted observability;
- the AG-UI Mastra bridge in the facility service, connected to that agent;
- unchanged CopilotKit inline chat in Angular 22 and React 19;
- AG-UI run lifecycle, text streaming, cancellation, and terminal errors;
- `@ai-sdk/openai` pointed at OpenRouter;
- `google/gemma-4-31b-it` as the configurable default model;
- a direct Angular component integration with scoped layout and
  streaming-scroll compatibility, plus a lazy React chat boundary; and
- Mastra capability-boundary, CopilotKit discovery, backend, and frontend
  tests.

The conventional SQLite application remains intact. This checkpoint does
**not** contain tools, SQL generation, facility-state injection, persistent
chat memory, human approval, A2UI, A2A, MCP, or an MCP App.

## Workspace layout

The workshop product is split into browser and server applications because
they run in different environments:

| Folder                  | Role                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `apps/angular-host`     | Angular browser frontend                                      |
| `apps/react-host`       | Alternative React browser frontend                            |
| `apps/facility-service` | Facility API, SQLite, telemetry, alarms, and Copilot endpoint |
| `apps/agent-service`    | Mastra agent service, Studio, and observability               |
| `packages/contracts`    | Shared schemas and TypeScript contracts; not a runnable app   |

Angular and React are alternative views of the same product. Both call the
facility service, which forwards agent runs to the Mastra service:

```text
Angular or React -> facility service (:3001) -> Mastra service (:4111)
```

## Run it

Requirements: Node 24 LTS or newer and pnpm 11.

Copy `.env.example` to `.env` and replace the placeholder with an OpenRouter
API key. `OPENROUTER_MODEL` is optional and defaults to
`google/gemma-4-31b-it`.

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts the facility backend, Mastra service, Mastra Studio, and
Angular host together. To use React instead, run `pnpm dev:backend` and
`pnpm dev:react` in separate terminals.

Default URLs:

| Host    | URL                     |
| ------- | ----------------------- |
| Angular | `http://localhost:4200` |
| React   | `http://localhost:5173` |
| API     | `http://localhost:3001` |
| Studio  | `http://localhost:4111` |

The live stream is available at `GET /api/metric-updates`. The UI only subscribes while **Continuous updates** is enabled; the backend continues recording simulated device readings in SQLite.

CopilotKit agent discovery is available at `GET /api/copilotkit/info`. In the
React host, the CopilotKit Inspector appears automatically on localhost; in
either host, the browser network panel exposes AG-UI lifecycle and text events.
Open Mastra Studio and select **Observability** to inspect the corresponding
agent run, model generation, timing, input, and output. Studio reads the same
locally persisted execution records created by chats from either frontend.

Build and test the checkpoint with:

```bash
pnpm check
```

## Teaching point

> AG-UI keeps the frontend contract stable while the backend agent framework
> changes from BuiltInAgent to Mastra.

Checkpoint 05 adds the first application capability: one constrained,
read-only generated-SQL historian tool. Until then, the Mastra agent remains
chat-only and data-blind.
The overall route is documented in [docs/checkpoints.md](./docs/checkpoints.md).
