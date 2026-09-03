# Runnable checkpoints

## Branching model

`main` is the canonical home of the complete workshop plan, branch map,
implementation briefs, and general instructions for running and extending the
project. Keep that knowledge current independently of the milestone branches.

Each numbered branch is a cumulative, independently runnable webinar
milestone. Never merge a numbered branch into `main` or into another milestone
branch. Instead, create each new milestone directly from its predecessor:

```text
main                 canonical knowledge and overall project
01-base-app          Part 1 snapshot
└── 02-basic-chat    Part 2 snapshot, based on 01-base-app
    └── 03-copilotkit-ag-ui
        └── 04-mastra-agent
            └── 05-frontend-tool
                └── 06-sql-tool
                    └── 07-human-in-loop
                        └── 08-a2ui
                            └── 09-a2a
                                └── 10-mcp-app
```

This preserves the exact state needed to walk forward through the webinar
without changing an earlier milestone.

This `07-human-in-loop` branch extends the completed `06-sql-tool`
checkpoint. It contains the complete conventional
chocolate-factory application: API, seven-day SQLite history, asynchronous
device updates, Angular and React hosts, filters, server-side pagination, and
persistent alarms. CopilotKit and AG-UI still provide the frontend contract,
and the Mastra agent can read bounded view/filter context, call the seven
browser tools, and use one reviewed generated-SQL tool. A separate Mastra
reviewer checks semantics; a deterministic read-only facility boundary retains
SQL execution authority. The agent can now propose raising one alarm through a
CopilotKit human-in-the-loop tool, but only an operator decision can reach the
facility-owned transactional action and audit boundary. Agent runs remain
inspectable in the local Mastra Studio, while accountability records stay in
facility SQLite. Checkpoint 08 and later rows remain planned progression.

| Checkpoint            | Reveal or enable                                                           | Limitation that motivates the next step                       |
| --------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `01-base-app`         | complete conventional app, live metrics, seven-day history, alarms         | fixed screens cannot answer unanticipated historian questions |
| `02-basic-chat`       | ordinary conversation through OpenAI SDK and OpenRouter; no tools          | the model cannot inspect application data                     |
| `03-copilotkit-ag-ui` | replace the custom chat with CopilotKit, BuiltInAgent, and AG-UI streaming | the standardized path still uses an embedded agent            |
| `04-mastra-agent`     | replace BuiltInAgent with Mastra while keeping CopilotKit chat-only        | the standardized stack is ready for application capabilities  |
| `05-frontend-tool`    | bounded view context and one patch-based frontend view/filter tool         | fixed controls cannot answer unanticipated data questions     |
| `06-sql-tool`         | reviewed SQL feeds a frontend tool and fixed Historian result view         | computed result shapes need bounded A2UI                      |
| `07-human-in-loop`    | approve/reject and correlated audit                                        | presentation is still entirely predetermined                  |
| `08-a2ui`             | trusted decision component catalogue                                       | specialist knowledge belongs behind another boundary          |
| `09-a2a`              | facilities/compliance Agent Card and conditional runbook                   | a case result still needs explorable evidence and UI          |
| `10-mcp-app`          | MCP corpus, `get_case_analysis`, portable app                              | production concerns need deeper treatment                     |
| `final`               | both hosts, resilience, audit, and full golden path                        | opens the two-day expansion backlog                           |

The completed checkpoint contract is in the
[Step 7 implementation brief](./step-07-human-in-loop.md). Create `08-a2ui`
directly from this branch for the next milestone.

## Readiness check per checkpoint

Before presenting a checkpoint, verify:

1. the previous limitation is visible;
2. the new protocol or tool has one clear responsibility;
3. the corresponding guardrail is observable in the UI or logs;
4. both framework hosts still consume the same shared contracts;
5. the next checkpoint is motivated by a concrete missing capability.
6. the next numbered branch is based directly on this checkpoint;
7. the canonical plan and branch map on `main` describe the checkpoint without
   merging its implementation into `main`.
