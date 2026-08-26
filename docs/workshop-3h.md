# Three-hour presenter runbook

The workshop uses one prebuilt reference system and selectively changes or reveals parts of it. It does not attempt to type every service from scratch.

Part 1 is complete on `01-base-app` and is the workshop's starting state. It
is a fully functional conventional application with no AI. Every later
checkpoint should be introduced as a response to a limitation visible in the
preceding checkpoint.

## Learning outcome

Participants should be able to assign a precise job to AG-UI, CopilotKit, Mastra, A2UI, A2A, MCP, and MCP Apps—and identify the guardrail introduced at each increase in autonomy.

## Timing

|      Time | Segment                                        | Runnable checkpoint |
| --------: | ---------------------------------------------- | ------------------- |
| 0:00–0:15 | Part 1: completed conventional app walkthrough | 01                  |
| 0:15–0:30 | Part 2: basic OpenAI-SDK chat via OpenRouter   | 02                  |
| 0:30–0:50 | Part 3: CopilotKit chat and AG-UI streaming    | 03                  |
| 0:50–1:10 | Part 4: Mastra agent and observable trace      | 04                  |
| 1:10–1:25 | Part 5: bounded frontend view tool             | 05                  |
| 1:25–1:45 | Part 6: generated SQL through AG-UI            | 06                  |
| 1:45–1:55 | Human approval and audit boundary              | 07                  |
| 1:55–2:05 | Break and buffer                               | —                   |
| 2:05–2:20 | Bounded A2UI decision surface                  | 08                  |
| 2:20–2:40 | A2A facilities/compliance specialist           | 09                  |
| 2:40–2:57 | MCP resources, tool, and portable MCP App      | 10                  |
| 2:57–3:00 | Recap and two-day expansion                    | final               |

Generative UI is compared with A2UI and MCP Apps, but code-generating UI is not implemented in the three-hour workshop.

## Golden path

1. Open Part 1 and demonstrate snapshot mode, continuous updates, the reading log, filters, pagination, seven-day history, shift managers, and the manual alarm lifecycle.
2. In Part 2, exchange ordinary user and assistant messages through the TypeScript backend, OpenAI SDK, and OpenRouter. Ask a historian-specific question and show that chat has no access to application data.
3. In Part 3, replace the custom chat with CopilotKit and a tool-free BuiltInAgent. Show the same conversation streaming through AG-UI and inspect its lifecycle events, but confirm that the assistant still cannot inspect the historian.
4. In Part 4, replace BuiltInAgent with a separate Mastra service without changing the CopilotKit frontend or capability boundary. Send a message from the application, then open Mastra Studio's **Observability → Traces** view and inspect that same run. The chat still has no tools.
5. In Part 5, ask: **Switch to the reading log and show only warnings from the Cooling room managed by Charles Bond.** Show the same `configure_facility_view` tool patching the existing Angular or React controls.
6. Ask: **Change the start date to now.** Confirm that the view and every other filter remain unchanged. Then clear the date filter and finally clear all filters.
7. In Part 6, ask: **Show me when the Cooling room went into warning during the last seven days and when each warning ended.** Inspect the SQL generated for the single `query_historian` tool and its generic result table. Previous days end at 14:00; today's warning is **Still active**.
8. Ask: **Show me the maximum air temperature for shift manager Charles Bond and, below that, for Denise Weber.** Show that the same SQL tool answers a different, previously unanticipated question.
9. Establish the incident evidence: air temperature has remained in warning since 12:00, humidity can cross its warning threshold, and the connecting door has no sensor and must be checked manually.
10. Choose **Ask facilities specialist**.
11. Follow the correlation ID through the coordinator and A2A service.
12. Inspect the conditional recommendation: check the connecting door; if open, close and observe; if closed, call cooling/electrical maintenance and place affected batches on quality hold when required by the fictional plant policy.
13. Choose **Open specialist guidance** and show the same sourced MCP App in Angular and React.
14. Approve or reject `review-alarm`, then read the audit trail and distinguish operational tracing from accountability.

## Failure demonstrations

- submit a write statement or a second SQL statement: the historian boundary rejects it before SQLite execution;
- stop the compliance service: the coordinator applies a deadline, retries once, records `operation-failed`, and returns an explicit error;
- submit the same correlation ID twice: the assessment is idempotent;
- submit the same operator decision twice: the second response is `already-decided`;
- reject alarm escalation: the decision is audited and the facility asset remains `at-risk` while the door-check runbook is still visible;
- request an unknown MCP case: the tool returns a structured error and does not invent evidence.

## Presenter guardrails

- Reiterate that all runbooks, policies, and legal material are fictional.
- Never frame the model as the authority; sources and human decisions are visible.
- Keep the distinction clear: A2A is agent delegation; MCP is capability/resource/UI exposure.
- The primary UI uses a trusted catalogue. The MCP App is executable UI from a trusted specialist server and is sandboxed by the host.
