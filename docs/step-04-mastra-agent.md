# Step 4 implementation brief — Mastra agent

## Objective

Replace Checkpoint 03's tool-free BuiltInAgent with a tool-free Mastra agent.
Keep both CopilotKit frontends and the AG-UI runtime contract unchanged. This
makes the framework boundary visible without granting the assistant any new
application capability.

Create `04-mastra-agent` directly from the completed
`03-copilotkit-ag-ui` checkpoint. Preserve all earlier milestones and create
`05-frontend-tool` directly from this checkpoint.

## Fixed decisions

- Keep Angular and React pointed at the same `/api/copilotkit` endpoint.
- Keep the runtime agent id `default` so neither frontend changes.
- Run the agent in a local Mastra service so its real executions are visible
  in Mastra Studio.
- Bridge the remote Mastra agent into the existing Copilot Runtime through
  AG-UI.
- Keep Gemma 4 through OpenRouter and the existing server-only
  `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` configuration.
- Preserve the exact Checkpoint 03 system prompt and data-blind boundary.
- Do not add tools, memory, facility state, frontend context, or actions until
  their later checkpoints.

## Backend shape

Create one Mastra `Agent` with id `default`, the existing static instructions,
and the OpenRouter AI SDK model. Register it in a Mastra instance served on
port 4111. The facility service uses the Mastra client and AG-UI bridge to
register that remote agent as `default` in `CopilotRuntime`, while continuing
to mount the same CopilotKit Node listener at `/api/copilotkit`.

The Mastra instance uses local LibSQL storage plus the Mastra storage exporter.
Consequently, a chat initiated in Angular or React produces a persisted trace
that can be inspected in Studio at `http://localhost:4111`. Studio observes the
production workshop agent; it does not run a duplicate demonstration agent.

The bridge uses `@ag-ui/mastra` 1.1.0 with the AG-UI 0.0.57 packages pinned by
CopilotKit Runtime 1.69.2. The package's CommonJS export is loaded deliberately:
its ESM bundle imports a named export from the CommonJS `fast-json-patch`
package, which fails when executed directly by Node without bundling.

Existing facility routes, SQLite access, telemetry, alarm workflows, and
frontend code remain unchanged.

The execution path is:

```text
Angular or React -> /api/copilotkit (facility service, :3001)
                 -> AG-UI Mastra bridge
                 -> Mastra agent service (:4111)
                 -> OpenRouter / Gemma 4

Mastra Studio (:4111) <- persisted observability from those same agent runs
```

## Capability boundary

Step 4 contains no:

- historian or database tool;
- facility-state or selected-view context injection;
- frontend action or generative UI;
- persistent conversation memory;
- human approval;
- A2A delegation; or
- MCP resource, tool, or app.

The same historian-specific question from Steps 2 and 3 must still be refused.
The new capability is backend-framework substitution, not data access.

## Demonstration

1. Open the unchanged Angular or React CopilotKit chat.
2. Show that `/api/copilotkit/info` still advertises `default`.
3. Exchange an ordinary message and inspect the AG-UI lifecycle and streamed
   text events.
4. Explain that the backend run now belongs to a Mastra agent.
5. Open Mastra Studio's Observability view and inspect that same run.
6. Ask when the Cooling room entered warning and show that the assistant still
   cannot inspect the historian.
7. Motivate Checkpoint 05: expose bounded view state and focused browser-side
   tools that can adjust the predetermined UI without granting historian
   access.

## Completion criteria

- The branch is based directly on `03-copilotkit-ag-ui`.
- Angular and React retain their existing CopilotKit integration unchanged.
- `/api/copilotkit/info` still advertises the `default` agent.
- A Mastra agent running in the local Mastra service, rather than BuiltInAgent,
  produces the response.
- The same frontend-triggered run appears in Mastra Studio observability.
- Runs stream AG-UI lifecycle and text events.
- Provider failure terminates the stream and cancellation remains owned by the
  unchanged Copilot Runtime runner.
- The Mastra agent has no tools and receives no facility data.
- OpenRouter credentials remain backend-only.
- Existing conventional application behavior remains green.
- Backend, Angular, React, and production-build checks pass.

## Implemented checkpoint

The `04-mastra-agent` branch implements this contract with Mastra Core 1.62,
the Mastra AG-UI bridge 1.1, CopilotKit Runtime 1.69, Angular 22, and React 19.
The backend tests assert the tool-free instructions boundary, remote runtime
discovery, and removal of the obsolete custom chat route. A live verification
request through CopilotKit confirms AG-UI streaming and a matching successful
trace in Mastra observability.
