# Part 1 / Checkpoint 01 — Conventional facility application

This completed branch is the starting state of the three-hour **Hands-On Agentic Frontends with AG-UI and CopilotKit** workshop.

It deliberately contains no AI or agentic protocols. The goal is to establish the conventional application and expose its limitation before introducing an assistant.

## Scenario

Soverius Chocolate has two adjacent production areas: a climate-controlled **Cooling room** and the **Packaging hall**. During the previous days, cooling-room air temperature enters warning at 12:00 and returns to normal at 14:00. On the current day, it enters warning at 12:00 and stays there. Humidity moves between normal and warning; the other simulated metrics remain normal. The connecting door must be checked manually because it has no sensor.

A person on night duty can inspect seven days of stored telemetry, use the continuously updated snapshot, raise an alarm for any metric, and acknowledge or resolve it. In snapshot mode, individual devices report at randomized intervals and every new reading is persisted. The application cannot interpret the combined evidence and recommend checking the connecting door before calling maintenance.

That missing capability motivates Checkpoint 02.

## What this checkpoint contains

- Angular 22 and React 19 implementations of the same conventional UI
- a conventional Node HTTP API backed by SQLite
- two rooms, eleven metrics, and deterministic historical readings
- randomized, one-device-at-a-time live readings over a server-sent event stream
- persisted raise, acknowledge, and resolve alarm workflows per metric
- one shared, validated facilities-domain contract
- unit tests and production builds

It does **not** contain CopilotKit, AG-UI, Mastra, A2UI, A2A, MCP, an MCP App, or an LLM.

## Run it

Requirements: Node 24 LTS or newer and pnpm 11.

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

> A complete traditional application can store history, evaluate predefined rules, and execute anticipated workflows. It still cannot interpret an unfamiliar combination of evidence or explain what the person on duty should do first.

The later AI and protocol checkpoints are planned but not yet implemented.
The overall route is documented in [docs/checkpoints.md](./docs/checkpoints.md).
