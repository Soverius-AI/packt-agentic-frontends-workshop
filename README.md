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

The ordinary request form calls `POST /api/investigate`. The facility service starts the Mastra `historianQueryWorkflow`. A generator proposes SQL, a separate agent reviews it, and the facility service applies deterministic policy before executing against its read-only historian. Complete readings appear in the existing table. Open **Query and review** to inspect the SQL and reviewer verdict.

Try **“Show critical readings in the Cooling room”** next. A request for a computed average should be rejected: this baseline deliberately supports complete reading records, not generated summary layouts.

The application owns data validation and execution. Mastra agents do not receive a writable database handle. Existing manual alarm buttons remain ordinary application operations; the AI cannot raise alarms in this branch.

## Chapter 3 checkpoint

The subsequent `ai-devcraft/03-agentic-ui` branch adds CopilotKit/AG-UI to the same backend: visible investigation progress, frontend view/filter tools, and a human approval card before an agent-requested alarm. A2UI is out of scope.

## Validation

`pnpm build` builds shared contracts, facility service, Mastra and Angular. `pnpm format:check` checks formatting. The historian policy and worker deadline are retained from the original implementation.

Earlier workshop documents under `docs/` are retained as source material; this README defines the AI DevCraft demo.
