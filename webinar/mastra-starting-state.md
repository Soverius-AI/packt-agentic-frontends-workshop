# Mastra starting state for chapter 4

Branches webinar-01, webinar-02 and webinar-03 intentionally have an empty
`apps/agent-service/src/mastra/agents/main/agent.ts`.

Mastra's `index.ts` registers `agents: {}`. It contains no agent imports, model
configuration, historian workflow construction or workflow registration.
The environment loader, port 4211, Studio CORS for localhost:4212, storage and
tracing stay prepared. Mastra and Studio start with no agents listed.

During chapter 4:

1. Write the agent in `agent.ts`, including its model, instructions and empty tools.
2. Import and register the agent in Mastra's `index.ts` as `default`.
3. Update the facility backend's existing `create-copilot-runtime.ts` to connect
   to that Mastra agent through the AG-UI adapter.
4. Restart the facility backend and demonstrate the app request and its Studio trace.

Historian implementation files remain available for their later chapter. They
are not connected by these two entry files. The completed chapter-4 code will
be saved on webinar-04 once it has been implemented and verified.
