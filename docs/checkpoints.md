# Runnable checkpoints

This `01-base-app` branch implements the completed first part and is the
starting point of the workshop. It contains the complete conventional
chocolate-factory application: API, seven-day SQLite history, asynchronous
device updates, Angular and React hosts, filters, server-side pagination, and
persistent alarms. It deliberately contains no AI. The later rows describe
the planned progression; they do not yet have checkpoint branches.

| Checkpoint             | Reveal or enable                                                        | Limitation that motivates the next step                       |
| ---------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| `01-base-app`          | complete conventional app, live metrics, seven-day history, alarms      | fixed screens cannot answer unanticipated historian questions |
| `02-basic-chat`        | ordinary conversation through OpenAI SDK and OpenRouter; no tools       | the model cannot inspect application data                     |
| `03-ag-ui-chat`        | migrate the same tool-free chat to AG-UI streaming and lifecycle events | the protocol is stable, but backend concerns are still mixed  |
| `04-mastra-copilotkit` | move to Mastra and CopilotKit while remaining chat-only                 | the standardized stack is ready for application capabilities  |
| `05-sql-tool`          | one generated-SQL historian tool and generic result table               | consequential tools need an authority boundary                |
| `06-human-in-loop`     | approve/reject and correlated audit                                     | presentation is still entirely predetermined                  |
| `07-a2ui`              | trusted decision component catalogue                                    | specialist knowledge belongs behind another boundary          |
| `08-a2a`               | facilities/compliance Agent Card and conditional runbook                | a case result still needs explorable evidence and UI          |
| `09-mcp-app`           | MCP corpus, `get_case_analysis`, portable app                           | production concerns need deeper treatment                     |
| `final`                | both hosts, resilience, audit, and full golden path                     | opens the two-day expansion backlog                           |

The implementation contract for the next checkpoint is in
[Step 2 implementation brief](./step-02-basic-chat.md).

## Readiness check per checkpoint

Before presenting a checkpoint, verify:

1. the previous limitation is visible;
2. the new protocol or tool has one clear responsibility;
3. the corresponding guardrail is observable in the UI or logs;
4. both framework hosts still consume the same shared contracts;
5. the next checkpoint is motivated by a concrete missing capability.
