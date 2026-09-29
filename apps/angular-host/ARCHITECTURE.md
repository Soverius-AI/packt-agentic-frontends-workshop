# Angular application structure

The chapter 2 foundation follows the domain and layer structure used in `/Users/rainerh/programming/testing`, scaled to one facility domain.

- `app.ts` is a router shell. `app.routes.ts` enters the facility domain through its public routes.
- `domains/facility/api` exposes the domain routes.
- `domains/facility/feat-dashboard` composes the dashboard.
- `domains/facility/feat-dashboard/historian-query.ts` contains the ordinary Signal Forms request form. It calls the facility HTTP client and hands successful reviewed query results to the store.
- `domains/facility/data` contains the NgRx Signal Store and HTTP/SSE client. UI actions use the store's public methods. This data layer has no CopilotKit or AG-UI imports.
- `domains/facility/model` contains frontend models and pure presentation functions. Shared API schemas remain in `packages/contracts`.
- `domains/facility/ui` contains components with signal inputs/models and outputs. These components do not inject the store, call HTTP, or import CopilotKit. Reading filters use Signal Forms. Common surface styles are shared locally; component styles remain encapsulated.

A `core` or `shared` folder can be introduced when there are genuinely cross-domain components or capabilities. Empty layers are deliberately omitted.

The store lives for the application lifetime, matching the reference app's root-provided stores. It owns loading, filters, pagination, selected history, historian results, and live-stream cleanup. Repeated result updates do not overwrite a view the user deliberately selected after a query.

Sheriff enforces domain/layer imports. ESLint additionally prevents CopilotKit imports in `data`, `model`, and `ui`. TypeScript strict mode and Angular strict template checking are enabled.

From the repository root:

```sh
pnpm --filter angular-host build
pnpm --filter angular-host lint
pnpm --filter angular-host test
```

Tests use Angular's Vitest builder in jsdom. They cover filter preservation and validation, pagination reset, historian-result handoff, stream cleanup, and bidirectional Signal Forms updates. Browser rehearsal covers real services and the plain request form.

The shared refactor originates on `ai-devcraft/02-backend-agents`. Branch 03 merges the committed chapter 2 baseline before adding CopilotKit integration. Branch numbers match the presentation chapters: 01 is Agentic Coding, 02 Backend Agents, 03 Agentic UI.

Components use inline templates and styles by default, including CLI generation defaults. The reusable `_surface.scss` partial stays shared.

## Chapter 3 integration

This branch merges the shared chapter 2 foundation. `feat-dashboard/agent` adds CopilotKit context and tools, progress rendering, chat, and human approval. The page uses chat in place of the plain query form; domain state and presentational components remain independent of CopilotKit. Approval methods and an audit component are the chapter 3 additions.
