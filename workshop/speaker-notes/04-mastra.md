# 04 — Move the agent into Mastra

**Start:** completed 03. **Completed code:** [solution 04](../solutions/04/).

## Say

“The Angular chat can remain as it is. We are changing the agent behind the runtime
and adding a place to inspect its execution.”

Show the route: Angular :4300 → facility runtime :3101 → Mastra :4211 → model.

## Open and change

1. `apps/agent-service/src/mastra/agents/main/agent.ts`: show `new Agent`, the
   `default` ID, prepared `main-04` prompt, injected model configuration, and empty
   `tools`. This agent factory already exists in the starter; type a small part
   if useful or explain it directly.
2. `apps/agent-service/src/mastra/index.ts`: show agent registration, storage and
   observability. Environment/model resolution lives here. Prepared historian
   code is not registered as a Studio workflow until milestone 06.
3. Start `pnpm dev:agent` in a second terminal. Open http://localhost:4211 and check
   that the default agent appears. Do not display the API key.
4. `apps/facility-service/src/workshop.ts`: switch the import and call from
   `createEmbeddedCopilotRuntime` to `createWorkshopCopilotRuntime`.
5. Open `copilot-runtime.ts`: show the remote Mastra agent and AG-UI bridge. Explain
   that its CommonJS compatibility loading is prepared setup, not the teaching goal.
6. Restart `pnpm dev` and reload the browser. No Angular file changes are needed.

## Demonstrate

From the application ask: **In one sentence, why is humidity relevant in a chocolate factory?**

In Studio's observability/traces view find the run from that app request. Show
input, model call, output, and timing. Distinguish execution tracing from the
decision audit introduced later. Ask a live-reading question again: still no data tool.

## Transition

“We can see the run, but the agent still cannot operate the application. Next we
give it specific frontend capabilities.”

## Recovery

Select 04, restart both terminals, reload browser/Studio. Confirm port 4211 and
the bridge URL before investigating model behavior. A direct Studio conversation
does not have the app's browser tools; use the app for subsequent demonstrations.
