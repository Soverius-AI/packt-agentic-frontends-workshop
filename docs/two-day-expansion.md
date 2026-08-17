# Ideas for expanding to a full two-day workshop

This is an expansion backlog, not a finished two-day agenda. Keep the same plant incident and deepen the engineering work instead of adding unrelated demos.

## Candidate hands-on modules

- Build the raw assistant and AG-UI event adapter rather than starting from the completed coordinator.
- Add streaming tool-call events, cancellation, reconnect/resume, and state-delta exercises.
- Replace the deterministic compliance corpus with a versioned RAG pipeline over supplied fictional legislation and plant policies; evaluate retrieval and citations.
- Implement authentication, tenant isolation, scoped agent identities, and authorization across A2A and MCP.
- Build a double-iframe MCP App sandbox proxy, CSP validation, permission review, and hostile-app exercises.
- Compare bounded A2UI, trusted MCP Apps, and sandboxed code-generating UI through three implementations of the same research task.
- Add persistent conversation and workspace memory with retention, invalidation, migration, and privacy rules.
- Instrument OpenTelemetry/Langfuse traces across host, AG-UI run, A2A task, MCP tool, and operator decision.
- Add contract, protocol, accessibility, adversarial, load, and browser tests.
- Add durable queues, persistent task/audit stores, retries with jitter, circuit breaking, and disaster recovery.
- Deploy the services independently and examine origin policy, secrets, cost, latency, and observability.
- Run a production-readiness and threat-modelling exercise in teams.

## Suggested shape

Day one can end with the approval-gated A2UI flow. Day two can start at the organisational boundary, build A2A plus MCP Apps, then deepen RAG, security, observability, evaluation, and deployment. Code-generating generative UI belongs here, where its sandbox can receive proper implementation and review time.
