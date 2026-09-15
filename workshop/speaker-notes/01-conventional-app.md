# 01 — Establish the application

**Start:** `pnpm workshop:select 01`, then `pnpm dev`. Open http://localhost:4200.
Backend: http://localhost:3101. Mastra API: http://localhost:4211/api.
Mastra Studio: http://localhost:4211 (same server and port).
Mastra starts from milestone 04; it need not be running here. No model key is required.

**Demo inputs:** Follow the numbered prompts for milestone 01 in the
[demo prompt sequence](../demo-prompts.md), or use this milestone’s Demo prompts
in the Presenter desk. Each includes setup, expected results and what to show.

## Say

“This application already works. It owns the readings, filters, history, and alarm
actions. We are going to connect an assistant to selected capabilities.”

Explain that Snapshot shows the latest reading per metric; Reading log filters
persisted records. A model response and a database reading have different origins.

## Open

- The application first; keep the editor closed for the initial tour.
- `apps/angular-host/src/app/facility-api.ts`: point at the ordinary HTTP calls.
- `packages/contracts/src/index.ts`: show a single dashboard schema and its
  inferred TypeScript type. The same contract is used in Angular and the server.

## Do and demonstrate

1. Show the latest readings and the continuous-update behavior in Snapshot.
2. Open Reading log. Choose Cooling room and Warning; show that filters and
   pagination already work without an assistant.
3. Open seven-day history from a metric. Explain that readings are stored in SQLite.
4. If demonstrating a manual alarm, raise, acknowledge, and resolve it using the
   conventional controls. Leave the intended approval-demo metric without an active
   alarm. The empty decision-audit panel is prepared infrastructure for milestone 07.
5. Point to the prepared assistant area: nothing is connected yet.

## Transition

“The interface can do these operations, but it cannot answer an ordinary question.
Let's connect a conversation first.”

**No live code in this milestone.** Avoid explaining telemetry generation or table
markup line by line. They are the prepared application on which the talk builds.

## Recovery

Check the facility terminal and http://localhost:3101/api/health if readings fail.
This is an API/proxy issue, not an AI issue. Never reset the database to fix a chat
problem. Reload the browser after selecting checkpoint 01.
