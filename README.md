# AI DevCraft: incident-management demos

Current checkpoint: **chapter 3**, `ai-devcraft/03-agentic-ui`.

The starting checkpoint is `ai-devcraft/02-backend-agents` (`146ad2e`).
Derived from the Packt `06-sql-tool` checkpoint (`2115c3d`). This isolated demo uses the Angular incident-management app, Mastra, and the existing reviewed SQL historian. The starting branch has no CopilotKit or A2UI integration; this chapter adds CopilotKit but keeps A2UI out of scope. The original Packt repository and its React examples are unchanged.

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

## Chapter 3: agentic UI

The same reviewed SQL workflow is now a Mastra tool behind CopilotKit/AG-UI. The chat replaces the basic form. No A2UI or generated layouts are involved.

1. Ask **“Show the highest air temperature for each shift manager.”** The activity card reports the real tool start and completion/rejection. Results populate the existing table. It does not simulate percentages or individual SQL phases.
2. Ask **“Switch to the reading log and filter to the Cooling room.”** Bounded frontend tools discover available options, change the view, and apply filters. This is the additional feature: the assistant operates the existing application.
3. Ask **“Raise an alarm for the Cooling room air temperature because I want the operator to investigate.”** An approval card pauses the conversation. Reject it first, then ask again and approve. Use a metric without an existing active alarm. Both decisions appear in the audit; approving creates an alarm only after the facility service validates and records the decision.

The approval card is an explicit demo operator interaction. This local workshop has a fixed operator identity, not production authentication. Existing manual alarm controls remain available. The model has no direct alarm mutation tool.

## Switch checkpoints

Stop the running demo, then use one of:

```sh
git switch ai-devcraft/02-backend-agents
git switch ai-devcraft/03-agentic-ui
```

Run `pnpm install` and `pnpm dev` after switching. `.env` and the local demo database are ignored and remain in place. Both branches use ports 4300/3101/4211; run one at a time. Use `pnpm reset:demo` before rehearsal when you want fresh seeded data.

## Validation

`pnpm build` builds shared contracts, facility service, Mastra and Angular. `pnpm format:check` checks formatting. `node --test apps/facility-service/test/demo.test.mjs` (after building) verifies progress outcomes and approval/rejection/idempotency. The historian policy and worker deadline are retained from the original implementation.

Earlier workshop documents under `docs/` are retained as source material; this README defines the AI DevCraft demo.
