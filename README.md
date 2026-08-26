# Part 5 / Checkpoint 05 — Bounded frontend view tool

This branch extends the completed Mastra checkpoint in the
three-hour **Hands-On Agentic Frontends with AG-UI and CopilotKit** workshop.

It gives the existing Mastra agent its first application capability: one
CopilotKit frontend tool that can switch between snapshot and reading-log
views and patch the existing filters. Angular and React expose the same tool
and bounded view context. The agent still cannot inspect readings or query the
historian.

## Scenario

Soverius Chocolate has two adjacent production areas: a climate-controlled **Cooling room** and the **Packaging hall**. During the previous days, cooling-room air temperature enters warning at 12:00 and returns to normal at 14:00. On the current day, it enters warning at 12:00 and stays there. Humidity moves between normal and warning; the other simulated metrics remain normal. The connecting door must be checked manually because it has no sensor.

A person on night duty can inspect seven days of stored telemetry, use the continuously updated snapshot, raise an alarm for any metric, and acknowledge or resolve it. In snapshot mode, individual devices report at randomized intervals and every new reading is persisted. The application cannot interpret the combined evidence and recommend checking the connecting door before calling maintenance.

The assistant can now ask the existing UI to show the Cooling room's warning
readings or change one date boundary without resetting the other filters. It
still cannot answer when that room entered warning unless the predetermined UI
already presents the answer. Generated SQL remains a separate capability for
Checkpoint 06.

## What this checkpoint adds

- one `configure_facility_view` browser-side tool in Angular 22 and React 19;
- bounded agent context containing the current view, active filters, and
  available filter options;
- shared patch semantics that preserve every omitted value;
- explicit clearing of one, several, or all filters;
- browser-local resolution of the literal `now`; and
- shared-contract and host tests for identical behavior.

The conventional SQLite application remains intact. This checkpoint does
**not** contain a backend tool, SQL generation, reading or historian context,
persistent chat memory, operational actions, human approval, A2UI, A2A, MCP,
or an MCP App.

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

> Bounded frontend context lets the agent understand the current UI, while a
> patch-based frontend tool changes only what the user requested.

Checkpoint 06 adds the first data capability: one constrained, read-only
generated-SQL historian tool. Until then, the agent can control the existing
view but remains blind to its readings.
The overall route is documented in [docs/checkpoints.md](./docs/checkpoints.md).
