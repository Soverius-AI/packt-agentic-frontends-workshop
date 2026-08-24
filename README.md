# Checkpoint 01 — Conventional facility application

This branch is the first runnable stage of the three-hour **Hands-On Agentic Frontends with AG-UI and CopilotKit** workshop.

It deliberately contains no AI or agentic protocols. The goal is to establish the conventional application and expose its limitation before introducing an assistant.

## Scenario

`ROOM-3-HVAC` reports a deterministic facilities anomaly:

- room temperature: 29 °C
- outside temperature: 29 °C
- temperature rising continuously for 30 minutes
- door state: unknown

A person on duty can see the anomaly and use the predefined **Raise facilities alarm** button. The application cannot answer whether checking the door should come before raising the alarm.

That missing capability motivates Checkpoint 02.

## What this checkpoint contains

- Angular 22 and React 19 implementations of the same conventional UI
- one shared, validated facilities-domain contract
- deterministic local state
- an explicit human-triggered alarm action
- unit tests and production builds

It does **not** contain CopilotKit, AG-UI, Mastra, A2UI, A2A, MCP, an MCP App, an LLM, or a backend service.

## Run it

Requirements: Node 24 LTS or newer and pnpm 11.

```bash
pnpm install
pnpm dev:angular
pnpm dev:react
```

Default URLs:

| Host    | URL                     |
| ------- | ----------------------- |
| Angular | `http://localhost:4200` |
| React   | `http://localhost:5173` |

Build and test the checkpoint with:

```bash
pnpm check
```

## Teaching point

> A traditional application can display situations and expose actions that its developers anticipated. It cannot interpret a new situation or explain what the person on duty should do first.

The complete integrated reference system remains on the `main` branch. The overall route is documented in [docs/checkpoints.md](./docs/checkpoints.md).
