# AI DevCraft: incident-management demos

Chapter 2 baseline: `ai-devcraft/02-backend-agents`.
Derived from the Packt `06-sql-tool` checkpoint (`2115c3d`). This isolated demo uses the Angular incident-management app, Mastra, and the existing reviewed SQL historian. There is no CopilotKit or A2UI integration in this branch. The original Packt repository and its React examples are unchanged.

## Run

```sh
pnpm install
cp .env.example .env # only if .env does not already exist
# Set OPENROUTER_API_KEY in .env.
pnpm dev
```

- Application: http://localhost:4300
- Facility service: http://127.0.0.1:3101
- Mastra Studio/API: http://localhost:4211

These ports are separate from the original Packt demo. `pnpm reset:demo` resets only this checkout's demo database to the last seven days. Stop this demo before switching branches and run `pnpm install` after switching.

## Chapter 2: backend agents

Ask **“Show the highest air temperature for each shift manager.”**

The ordinary request form calls `POST /api/investigate`. The facility service starts the Mastra `historianQueryWorkflow`. A generator proposes SQL, a deterministic preflight rejects prohibited statements, a separate agent reviews the meaning, and the facility service applies its full deterministic policy before executing against the read-only historian.

The workflow is **Generate SQL → Preflight SQL → Review SQL → Validate and execute**. Preflight uses the same SQL-aware lexical scanner as the execution boundary. It rejects write/schema operations and multiple statements, while distinguishing keywords from quoted text and comments. Rejection stops the workflow before the reviewer or database is called; the form explains that review was not run. The reviewer model is unchanged.

Preflight is an early statement-policy check, not a proof against every possible SQL injection. SQLite authorization, read-only access, result-shape checks, and execution limits remain mandatory. Complete readings appear in the existing table. Open **Query and review** to inspect the SQL and reviewer verdict.

Try **“Show critical readings in the Cooling room”** next. A request for a computed average should be rejected: this baseline deliberately supports complete reading records, not generated summary layouts.

The application owns data validation and execution. Mastra agents do not receive a writable database handle. Existing manual alarm buttons remain ordinary application operations; the AI cannot raise alarms in this branch.

## Chapter 3 checkpoint

The subsequent `ai-devcraft/03-agentic-ui` branch adds CopilotKit/AG-UI to the same backend: visible investigation progress, frontend view/filter tools, and a human approval card before an agent-requested alarm. A2UI is out of scope.

## Validation

`pnpm build` builds shared contracts, facility service, Mastra and Angular. `pnpm format:check` checks formatting. The historian policy and worker deadline are retained from the original implementation.

Earlier workshop documents under `docs/` are retained as source material; this README defines the AI DevCraft demo.

## Angular structure

The shared Angular refactor originates on this backend-only branch. It uses a facility domain, Signal Store, Signal Forms, single-file components, strict checking, and Sheriff boundaries. See [Architecture](apps/angular-host/ARCHITECTURE.md). Run `pnpm --filter angular-host lint` and `pnpm --filter angular-host test`.

Branch numbers match talk chapters: 01 Agentic Coding, 02 Backend Agents, 03 Agentic UI.

Preflight regression tests: `pnpm --filter @packt-workshop/agent-service test`. Execution-boundary tests: `node --test apps/facility-service/test/historian-policy.test.mjs` after building contracts and the facility service.
