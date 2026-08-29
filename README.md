# Part 6 / Checkpoint 06 — Reviewed generated SQL

This branch extends the completed Mastra checkpoint in the
three-hour **Hands-On Agentic Frontends with AG-UI and CopilotKit** workshop.

It keeps all seven bounded frontend tools from Checkpoint 05 and adds one
backend data capability: `query_historian({ sql, explanation })`. The primary
Mastra agent generates SQL, a separate tool-free Mastra reviewer checks whether
that SQL answers the operator's question, and a deterministic facility-service
policy decides whether the exact statement may execute against SQLite.

## Scenario

Soverius Chocolate has two adjacent production areas: a climate-controlled **Cooling room** and the **Packaging hall**. During the previous days, cooling-room air temperature enters warning at 12:00 and returns to normal at 14:00. On the current day, it enters warning at 12:00 and stays there. Humidity moves between normal and warning; the other simulated metrics remain normal. The connecting door must be checked manually because it has no sensor.

A person on night duty can inspect seven days of stored telemetry, use the continuously updated snapshot, raise an alarm for any metric, and acknowledge or resolve it. In snapshot mode, individual devices report at randomized intervals and every new reading is persisted. The application cannot interpret the combined evidence and recommend checking the connecting door before calling maintenance.

The assistant can now answer historian questions that were not anticipated as
screens or fixed endpoints. The generated SQL, reviewer verdict, policy
version, and generic result table remain visible in both framework hosts.

## What this checkpoint adds

- a primary Mastra agent that generates one SQLite `SELECT` or `WITH` query;
- a separate `sql-reviewer` Mastra agent that checks semantic correctness but
  has no tools and no execution authority;
- a deterministic SQL policy using a read-only connection, SQLite runtime
  authorization, a dedicated `historian_readings` view, function and column
  allowlists, one-statement enforcement, row/size caps, and a worker deadline;
- one internal facility endpoint that owns historian execution;
- structured SQL, reviewer, policy, and table results over the existing AG-UI
  run; and
- equivalent accessible generic result renderers in Angular 22 and React 19.

The reviewer is deliberately not a security boundary. Even an approved query
must pass deterministic validation, and the generated-SQL connection cannot
write facility data. This checkpoint does **not** add persistent chat memory,
operational actions, human approval, A2UI, A2A, MCP, or an MCP App.

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
facility service, which forwards agent runs to Mastra. A historian tool call
returns to the facility-owned execution boundary:

```text
Angular or React -> facility service (:3001) -> primary Mastra agent (:4111)
                                              -> SQL reviewer agent
                                              -> query_historian
                                              -> facility SQL policy (:3001)
                                              -> read-only facility SQLite
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

Build and check formatting with:

```bash
pnpm check
```

## Teaching point

> Agent review can improve semantic correctness; only deterministic enforcement
> decides whether generated SQL may execute.

Checkpoint 07 adds the authority boundary for consequential alarm actions:
the model may propose an operation, but an operator must approve or reject it.
The overall route is documented in [docs/checkpoints.md](./docs/checkpoints.md).
