# 03 — Replace the native chat with CopilotKit and AG-UI

**Start:** completed 02. **Completed code:** [solution 03](../solutions/03/).

**Demo inputs:** Follow the numbered prompts for milestone 03 in the
[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts
in the Presenter desk. Each includes setup, expected results and what to show.

## Say

“The next change is how we connect and display an agent run. The assistant still
has the same data limitation. CopilotKit provides the interaction; AG-UI carries
the run lifecycle, streamed text, and later tool activity.”

## Open and change

1. `apps/angular-host/src/app/app.config.ts`: add the `provideCopilotKit` and label
   providers from [solution 03](../solutions/03/apps/angular-host/src/app/app.config.ts).
   Point to `runtimeUrl: '/api/copilotkit'` and the Angular development proxy.
2. Replace the three `chat.component.*` wrapper files with solution 03. This replaces
   the active BasicChatComponent with CopilotChat; the prepared basic component
   remains available in Angular. Open the template
   and focus on `<copilot-chat agentId="default" appStreamingAutoScroll />`.
   The scrolling directive and surrounding layout are prepared support.
3. `apps/facility-service/src/workshop.ts`: connect
   `createEmbeddedCopilotRuntime(options)` and disconnect native chat.
4. Open `embedded-copilot-runtime.ts`: show the `BuiltInAgent`, model, static prompt,
   `agents.default`, and listener. No tools are registered.
5. Restart `pnpm dev` (or your `pnpm dev:backend` / `pnpm dev:all` launcher); reload the browser to start a new conversation.

## Demonstrate

Ask: **Why does temperature control matter when making chocolate?**

Show text arriving incrementally.
In Network, inspect the CopilotKit request and its streaming response; locate
the run-start, text-message, and run-finish events where exposed by the transport.
Explain that streaming chunks are transport observations, not a trace of hidden reasoning.

Ask: **Show only warnings from the Cooling room.**

Expected: no filter changes because no frontend tools have been connected. The
frontend still owns the filters and the runtime has no handler to change them.

## Transition

“We have a stable frontend connection. We can now move the agent into Mastra while
keeping that interface.”

## Recovery

Select 03, restart the facility process and reload. Check
http://localhost:3101/api/copilotkit/info for discovery. Inspect matching
`default` agent IDs and provider URL if the chat is empty. Mastra is not needed yet.
