# Three-hour presenter runbook

The workshop uses one prebuilt reference system and selectively changes or reveals parts of it. It does not attempt to type every service from scratch.

## Learning outcome

Participants should be able to assign a precise job to AG-UI, CopilotKit, Mastra, A2UI, A2A, MCP, and MCP Apps—and identify the guardrail introduced at each increase in autonomy.

## Timing

|      Time | Segment                                         | Runnable checkpoint |
| --------: | ----------------------------------------------- | ------------------- |
| 0:00–0:15 | Room HVAC scenario and deterministic UI         | 01                  |
| 0:15–0:35 | Raw assistant and the plumbing problem          | 02                  |
| 0:35–1:00 | AG-UI lifecycle and state snapshots             | 03                  |
| 1:00–1:20 | Mastra backend tools and CopilotKit integration | 04                  |
| 1:20–1:35 | Human approval and audit boundary               | 05                  |
| 1:35–1:45 | Break and buffer                                | —                   |
| 1:45–2:10 | Bounded A2UI decision surface                   | 06                  |
| 2:10–2:35 | A2A facilities/compliance specialist            | 07                  |
| 2:35–2:55 | MCP resources, tool, and portable MCP App       | 08                  |
| 2:55–3:00 | Recap and two-day expansion                     | final               |

Generative UI is compared with A2UI and MCP Apps, but code-generating UI is not implemented in the three-hour workshop.

## Golden path

1. Open either framework host and inspect the `ROOM-3-HVAC` anomaly: its temperature has risen for 30 minutes and now matches the outside temperature.
2. Choose **Ask facilities specialist**.
3. Follow the correlation ID through the coordinator and A2A service.
4. Inspect the conditional recommendation: check the door; if open, close and observe; if closed, call the maintenance electrician.
5. Choose **Open specialist guidance** and show the same sourced MCP App in Angular and React.
6. Approve or reject `review-alarm` and verify that the human decision—not the specialist—appears in the audit trail.
7. Read the audit trail and distinguish operational tracing from accountability.

## Failure demonstrations

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
