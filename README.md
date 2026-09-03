# Part 7 / Checkpoint 07 — Human approval and correlated audit

This branch extends the completed reviewed-SQL checkpoint in the
three-hour **Hands-On Agentic Frontends with AG-UI and CopilotKit** workshop.

It keeps all seven bounded frontend tools from Checkpoint 05 and gives the
primary agent one narrow backend tool: `query_historian({ question })`. That
tool starts the separately registered `historian-query` Mastra workflow. A
dedicated tool-free generator agent creates SQL, a separate tool-free reviewer
checks whether that SQL answers the operator's question, and a deterministic
facility-service policy decides whether the exact statement may execute against
SQLite.

It now adds one consequential action without transferring authority to the
model. The assistant can propose raising an alarm for one exact metric through
`review_alarm({ metricId, metricName, reason })`. CopilotKit pauses the AG-UI
run while a named operator approves or rejects the proposal. The facility
service records the decision and actual execution outcome in SQLite before the
agent continues.

## Scenario

Soverius Chocolate has two adjacent production areas: a climate-controlled **Cooling room** and the **Packaging hall**. During the previous days, cooling-room air temperature enters warning at 12:00 and returns to normal at 14:00. On the current day, it enters warning at 12:00 and stays there. Humidity moves between normal and warning; the other simulated metrics remain normal. The connecting door must be checked manually because it has no sensor.

A person on night duty can inspect seven days of stored telemetry, use the continuously updated snapshot, raise an alarm for any metric, and acknowledge or resolve it. In snapshot mode, individual devices report at randomized intervals and every new reading is persisted. The application cannot interpret the combined evidence and recommend checking the connecting door before calling maintenance.

The assistant can now select stored historian readings that were not anticipated
by the fixed filters. In Angular, a successful reviewed query is passed to the
`show_historian_readings` frontend tool, which opens a dedicated Historian result
view backed by the existing fixed reading grid. The result remains available
while the operator moves between all three views. Computed result shapes such as
averages and counts remain out of scope until the later A2UI checkpoint.

## What this checkpoint adds

- a primary Mastra agent that can call one narrow historian tool;
- a thin tool adapter that starts the visible `historian-query` workflow without
  generating, reviewing, validating, or executing SQL itself;
- a dedicated, workflow-private `sql-generator` Mastra agent that generates one
  SQLite `SELECT` or `WITH` query;
- a separate, workflow-private `sql-reviewer` Mastra agent that checks semantic
  correctness but has no tools and no execution authority;
- a deterministic SQL policy using a read-only connection, SQLite runtime
  authorization, a dedicated `historian_readings` view, function and column
  allowlists, one-statement enforcement, row/size caps, and a worker deadline;
- one internal facility endpoint that owns historian execution;
- a fixed result contract containing complete stored reading records over the
  existing AG-UI run;
- an Angular frontend tool that explicitly populates a third Historian result
  view while reusing the existing reading table;
- one shared `review_alarm` human-in-the-loop contract rendered by both hosts;
- an accessible approval card that always resolves both approve and reject
  decisions;
- a facility-owned transactional boundary that validates the metric, records
  the decision, and conditionally raises the alarm; and
- a durable correlated audit showing the proposal, operator, decision, actual
  outcome, alarm ID, and failure reason.

The SQL reviewer is deliberately not a security boundary. Even an approved query
must pass deterministic validation, and the generated-SQL connection cannot
write facility data. Likewise, the model's alarm proposal is not authorization:
only the operator's explicit decision can enter the facility transaction. This
checkpoint does **not** add persistent chat memory, agent-driven acknowledge or
resolve actions, A2UI, A2A, MCP, or an MCP App.

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
facility service, which forwards agent runs to Mastra. The model sees only the
narrow tool input. The tool starts the registered workflow and returns its
result through the facility-owned boundary:

```text
Angular or React -> facility service (:3001) -> primary Mastra agent (:4111)
                                              -> query_historian({ question })
                                              -> historian-query workflow
                                              -> SQL generator agent
                                              -> SQL reviewer agent
                                              -> facility SQL policy (:3001)
                                              -> read-only facility SQLite

Angular or React -> review_alarm proposal -> operator approves/rejects
                 -> facility action + audit boundary (:3001)
                 -> facility SQLite -> structured result resumes AG-UI run
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

> The model may propose a consequential action; only a named human decision can
> authorize it, and the audit records what actually happened.

Checkpoint 08 uses A2UI to move beyond entirely predetermined result
presentation while retaining a trusted component catalogue.
The overall route is documented in [docs/checkpoints.md](./docs/checkpoints.md).
