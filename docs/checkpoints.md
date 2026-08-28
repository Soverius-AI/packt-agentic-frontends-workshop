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

The `01-base-app` branch implements the completed first part and is the
starting point of the workshop. `02-basic-chat` adds application-aware but
data-blind multi-turn conversation through Gemma 4 on OpenRouter. The later
rows describe the planned progression; they do not yet have checkpoint
branches.

| Checkpoint            | Reveal or enable                                                           | Limitation that motivates the next step                       |
| --------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `01-base-app`         | complete conventional app, live metrics, seven-day history, alarms         | fixed screens cannot answer unanticipated historian questions |
| `02-basic-chat`       | ordinary conversation through OpenAI SDK and OpenRouter; no tools          | the model cannot inspect application data                     |
| `03-copilotkit-ag-ui` | replace the custom chat with CopilotKit, BuiltInAgent, and AG-UI streaming | the standardized path still uses an embedded agent            |
| `04-mastra-agent`     | replace BuiltInAgent with Mastra while keeping CopilotKit chat-only        | the standardized stack is ready for application capabilities  |
| `05-frontend-tool`    | four option-discovery tools plus three bounded view/filter mutation tools  | fixed controls cannot answer unanticipated data questions     |
| `06-sql-tool`         | one generated-SQL historian tool and generic result table                  | consequential tools need an authority boundary                |
| `07-human-in-loop`    | approve/reject and correlated audit                                        | presentation is still entirely predetermined                  |
| `08-a2ui`             | trusted decision component catalogue                                       | specialist knowledge belongs behind another boundary          |
| `09-a2a`              | facilities/compliance Agent Card and conditional runbook                   | a case result still needs explorable evidence and UI          |
| `10-mcp-app`          | MCP corpus, `get_case_analysis`, portable app                              | production concerns need deeper treatment                     |
| `final`               | both hosts, resilience, audit, and full golden path                        | opens the two-day expansion backlog                           |

The completed contracts through the current checkpoint are documented in the
[Step 4 implementation brief](./step-04-mastra-agent.md) and
[Step 5 implementation brief](./step-05-frontend-tool.md). Create
`06-sql-tool` directly from `05-frontend-tool` for the next milestone.

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
