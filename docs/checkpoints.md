# Runnable checkpoints

The repository contains the final integrated system. These checkpoints are presenter states, not duplicate source trees. Tags or workshop branches can be cut from this map when rehearsal stabilises.

| Checkpoint             | Reveal or enable                                         | Limitation that motivates the next step              |
| ---------------------- | -------------------------------------------------------- | ---------------------------------------------------- |
| `01-base-app`          | room HVAC card and deterministic trend telemetry         | fixed screens cannot express unanticipated intent    |
| `02-raw-assistant`     | direct intent-to-capability sketch                       | custom streaming/tool/state plumbing grows quickly   |
| `03-ag-ui`             | `/ag-ui` run lifecycle and state snapshot                | protocol is stable, backend concerns are still mixed |
| `04-mastra-copilotkit` | Mastra tools and `/copilotkit` runtime                   | consequential tools need an authority boundary       |
| `05-human-in-loop`     | approve/reject and correlated audit                      | presentation is still entirely predetermined         |
| `06-a2ui`              | trusted decision component catalogue                     | specialist knowledge belongs behind another boundary |
| `07-a2a`               | facilities/compliance Agent Card and conditional runbook | a case result still needs explorable evidence and UI |
| `08-mcp-app`           | MCP corpus, `get_case_analysis`, portable app            | production concerns need deeper treatment            |
| `final`                | both hosts, resilience, audit, and full golden path      | opens the two-day expansion backlog                  |

## Readiness check per checkpoint

Before presenting a checkpoint, verify:

1. the previous limitation is visible;
2. the new protocol or tool has one clear responsibility;
3. the corresponding guardrail is observable in the UI or logs;
4. both framework hosts still consume the same shared contracts;
5. the next checkpoint is motivated by a concrete missing capability.
