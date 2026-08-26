# Packt Three-Hour Workshop Blueprint --- Building Agentic UIs with Angular & React

**Primary format:** 3-hour Packt workshop\
**Presenters:** Rainer Hahnekamp & Murat Sari\
**Purpose:** Canonical design and implementation plan for the three-hour
workshop, followed by ideas for expanding the same material into a full
two-day workshop.

## How to use this document

Sections 1--17 define the complete three-hour workshop: its narrative,
scenario, concepts, guardrails, timing, and implementation checkpoints.
They are the primary deliverable and should be detailed enough to guide
both presenters and implementation agents.

**Current implementation status:** Part 1 is complete on the
`01-base-app` branch. It is the starting point for the workshop, not an
exercise that participants must build. The remaining AI and protocol stages
below are planned and still need their own runnable checkpoints.

The final section, **Ideas for a Full Two-Day Workshop**, is deliberately
different. It is an expansion backlog rather than a finished agenda. It
identifies topics that could be added or explored in greater depth while
preserving the same incident-management scenario and narrative backbone.

## 1. Workshop concept

The workshop evolves one facilities incident-management application step
by step. Each new technology is introduced only when the previous
architecture reaches a concrete limitation.

> **Start with a deterministic application and progressively increase
> user/AI autonomy, while adding a corresponding guardrail at every
> step.**

Storyline: **Traditional UI → AI-assisted UI → standardized agentic UI →
A2UI → generative UI → multi-agent system.**

Memory, security, observability, and auditability are cross-cutting
concerns. They are mentioned where they become relevant rather than
becoming extra chapters in the three-hour version.

## 2. Scenario

The application represents Soverius Chocolate. Its first deterministic
incident concerns the climate-controlled Cooling room and the adjacent
Packaging hall. On previous days, the cooling-room air temperature enters
warning at exactly 12:00 and returns to normal at exactly 14:00. On the
current day it enters warning at 12:00 but does not recover. Humidity moves
between normal and warning, while the remaining simulated metrics stay in
their normal ranges. The connecting door has no sensor; whether it is open is
therefore a hypothesis that a person must check, not a fact in the telemetry.

The base application is already a complete conventional system. A Node API
stores seven days of room and equipment telemetry in SQLite. A conventional
simulator persists one randomized device reading at a time and publishes it
to clients that enable continuous updates. The Angular and React hosts show
current readings and history and let an operator raise, acknowledge, and
resolve an alarm for any metric. No AI or agentic protocol is involved yet.

## 3. Autonomy model

Use a recurring visual with:

- **X-axis:** developer control → AI/user autonomy
- **Y-axis:** static UI → dynamic UI

| Stage           | UI                   | Autonomy    |
| --------------- | -------------------- | ----------- |
| Traditional app | Static               | Very low    |
| Chat/querying   | Static               | Low         |
| Tool calling    | Static               | Medium      |
| A2UI            | Dynamic, constrained | Medium/high |
| Generative UI   | Highly dynamic       | High        |

The developer never simply "gives up control." Control moves from
defining every screen to defining tools, permissions, approval
boundaries, component catalogues, execution environments, capability
APIs, and policies.

## 4. Part 1 --- Completed conventional application

Start the workshop from the completed `01-base-app` checkpoint. Show the
Angular version of the deterministic factory application; the React host
demonstrates that the same backend and shared contracts are framework-neutral.
Inspect the SQLite history and complete the manual alarm workflow.

The starting application already provides:

- a snapshot table with the latest value for every metric and continuous
  one-device-at-a-time updates;
- a reading log with date/time, shift-manager, room, metric, and condition
  filters plus server-side pagination in pages of 50;
- seven days of deterministic historical data, including all three daily
  shifts and their managers;
- a seven-day metric chart and persisted raise, acknowledge, and resolve
  alarm workflows; and
- a Node API, SQLite historian, shared validated contracts, and equivalent
  Angular and React hosts.

There is deliberately no LLM, chat, CopilotKit, AG-UI, Mastra, A2UI, A2A,
MCP, or MCP App in Part 1.

```text
Device updates → SQLite history → Conventional facility API
                                           │
                                           ├──> Angular
                                           └──> React
                                  │
                                  ▼
                    Predefined alarm workflow
```

Key message:

> **Traditional applications let users do what developers anticipated.
> AI lets users express intent that developers did not necessarily
> anticipate as a specific screen or control.**

This limitation motivates AI.

## 5. Part 2 --- Basic conversation with the OpenAI SDK

Add a chat panel beside the existing metric tables. Extend the TypeScript Node
backend with the official `openai` JavaScript/TypeScript SDK and a small
application-owned chat endpoint. Configure the SDK to use OpenRouter through
`baseURL: "https://openrouter.ai/api/v1"`; keep the OpenRouter API key on the
server.

Part 2 supports only a basic conversation:

- the operator sends a message;
- the backend sends the conversation history to the model;
- the model returns an assistant message; and
- the Angular/React host renders user and assistant messages.

Use a deliberately small message contract and a non-streaming request first.
Short-term context consists only of the messages sent with the request. There
are no tools, generated SQL, frontend actions, facility-state injection,
CopilotKit, or AG-UI.

The first questions can be conversational, for example:

> What does a warning condition generally mean in an incident-management
> system?

Then ask the important application-specific question:

> When did the Cooling room enter warning during the last seven days?

The correct Part 2 assistant must say that it cannot inspect the historian. It
can converse, but it cannot access application data. Before adding that
capability, use the hand-written chat transport itself as the next limitation.

### First guardrails

Introduce conversation scope immediately. The industrial assistant should
reject unrelated general-chat use, control cost, and protect the application's
purpose. Discuss system instructions, rate limits, token budgets, quotas,
monitoring, logging, and deliberate conversation-retention boundaries.

## 6. Part 3 --- Introduce AG-UI before tool calling

Keep the assistant chat-only, but use the desire for streaming and explicit run
lifecycle as pressure on the hand-written `/api/chat` integration. Even this
small integration must define message payloads, partial text, completion,
errors, cancellation, and conversation state.

Ask:

> **Why are we designing our own frontend-to-agent protocol?**

Present AG-UI as the standard communication layer between agentic
backends and user-facing applications. Streaming is the initial hook,
not the entire story. Replace the custom chat response with an AG-UI run and
standard lifecycle/text events, while deliberately keeping the assistant free
of tools.

First argument:

> **Plumbing:** stop implementing infrastructure conventions ourselves.

```text
Before: Angular/React → Custom Protocol → Node + LLM SDK
After:  Angular/React → AG-UI → Agent Backend
```

Checkpoint success is behavioural parity: the same basic conversation now
streams through AG-UI. No historian query works yet. This sequencing ensures
that the workshop never implements a native OpenAI-SDK tool-call loop.

## 7. Part 4 --- Mastra and CopilotKit

Start with embedded Node + LLM SDK, then migrate the agent
implementation to **Mastra** (while mentioning alternatives such as ADK
or LangGraph).

Run that agent in a separate local Mastra service. Keep both frontends pointed
at the existing CopilotKit endpoint in the facility service, which bridges the
request to Mastra over AG-UI. The frontend contract remains stable while the
agent framework moves behind a service boundary:

```text
Angular/React → facility service/Copilot Runtime → Mastra service → OpenRouter
                                                    │
                                                    └→ Studio observability
```

Second argument:

> **Decoupling:** the frontend is not tightly coupled to one agent
> framework.

The two explicit AG-UI/CopilotKit arguments are therefore **plumbing** and
**decoupling**. Open Mastra Studio's **Observability → Traces** view and inspect
the same run initiated from Angular or React. This makes the new backend
boundary and its operational benefit visible. At this checkpoint the
standardized frontend/backend path is ready for tools, but the assistant can
still only exchange messages.

## 8. Part 5 --- Generated SQL through the standardized stack

Add the first and only data tool to the Mastra agent, carried over AG-UI and
presented by CopilotKit:

```text
query_historian({ sql, explanation })
```

The model receives a compact description of the read-only historian schema.
It translates the user's natural-language question into SQL and supplies that
SQL as the tool argument. The TypeScript backend validates and executes the
query, then returns columns and rows that the chat renders in a generic result
table. Display the generated SQL and the model's short explanation so the
translation is visible to the audience.

The primary example is:

> Show me when the Cooling room went into warning during the last seven days
> and when each warning ended.

The generated query can use SQLite CTEs and `LAG()` to detect warning
transitions. Previous days should show 12:00--14:00; the current day must be
labelled **Still active** rather than given an invented end time.

The same tool can answer the second question without adding another
application capability:

> Show me the maximum air temperature for shift manager Charles Bond and,
> below that, for Denise Weber.

This is the eye-opening moment: one tool can answer useful historian questions
that were not anticipated as filters or dedicated endpoints. It also creates
a clear new responsibility. The execution boundary must:

- open SQLite with read-only access;
- accept one `SELECT` or `WITH` statement only;
- reject writes, schema changes, pragmas, attachments, and multiple statements;
- allowlist historian tables and columns;
- enforce a row limit and execution timeout; and
- audit the question, generated SQL, and result metadata.

Fixed, parameterized application tools remain the safer production alternative
and should be discussed as a trade-off, not implemented as the primary
three-hour example.

CopilotKit can now also expose structured frontend tools. Possible examples
include `setMetricFilter`, `selectMetric`, and `triggerAlarm`.

```text
Agent → CopilotKit → Angular/React Tool → Store → UI
```

Narrative correction: this is not the first agentic moment. The direct SDK
version already supported conversation. The improvement is a **standardized,
structured, reusable integration for tools and UI actions**.

## 9. Part 6 --- Human approval and deterministic UI checkpoint

### Human-in-the-loop

For consequential actions such as triggering alarms:

```text
Agent proposes → UI asks → Operator approves/rejects → Tool executes
```

The model can recommend or prepare an action without automatically
receiving permission to execute it.

This is a natural place to introduce **auditability**: what was
recommended, what action was proposed, who approved it, when, and what
actually executed.

Pause and classify the system. AI can change data and trigger
developer-defined flows, but developers still created the grid, dialogs,
sidebar, controls, and layout.

> **The behaviour is dynamic; the presentation is still deterministic.**

This motivates A2UI.

## 10. Part 7 --- A2UI

Introduce a **power-user** persona. Instead of a fixed grid, give the
user an assistant and initially empty canvas.

Example: "Compare temperature anomalies with maintenance incidents for
production line 3 over the last week."

The agent can compose an interface from approved components such as:

- MachineTable
- MetricChart
- IncidentTimeline
- AlarmSummary
- TechnicianList
- StatusCard

A2UI remains controlled:

> **Developers no longer define every screen; they define the trusted
> vocabulary from which screens may be composed.**

### Memory belongs naturally here

If a power user creates a useful workspace, they may expect it to return
next session. Persist selected widgets, layout, filters, preferred
metrics, or saved investigations.

Distinguish **conversation memory** from **workspace/personalization
memory**.

Persistence guardrails include user/tenant isolation, retention rules,
privacy, versioning, and validation before restoring generated UI state.

## 11. Generative UI comparison

Ask: **What if the approved component catalogue is itself too
restrictive?**

Compare this with fully generative UI where executable JavaScript/UI can
be produced dynamically. In the three-hour workshop this remains a
conceptual boundary and architecture discussion; participants do not
implement code-generating UI.

```text
User request → Agent → Generated UI/code → Sandbox → Rendered UI
```

Do not describe this as "giving the whole UI to AI."

> **Developer control moves from defining the interface to defining the
> execution environment and its boundaries.**

The sandbox is the guardrail. Generated code should not automatically
receive unrestricted DOM, storage, cookie, credential, network, backend,
application-state, or machine-control access.

Discuss capability APIs, network restrictions, execution/resource
limits, content/code inspection, CSP/security boundaries, and human
approval for consequential actions.

Hands-on implementation of generated code and its sandbox belongs in the
two-day expansion, where there is enough time to treat the security model
properly.

### Observability

This is a natural point to ask: why did the system behave this way?

Track model runs, prompts/context, generated code/UI, tool/capability
use, latency, token usage, errors, sandbox violations, and execution
outcomes.

Useful distinction:

> **Observability:** Why did the system behave this way?\
> **Auditability:** Who approved or performed a consequential action,
> and when?

## 12. Parts 8 and 9 --- A2A, MCP Apps, and specialist agents

Use the Cooling room anomaly as the primary A2A scenario. Its air temperature
has remained in warning since 12:00 and is approaching the temperature in the
adjacent Packaging hall. The person on the night shift may be a receptionist
rather than a trained facilities engineer.

The primary agent sends the incident and its trend data to a specialist
facilities/compliance agent. That external agent returns a simple,
conditional runbook:

1. Do not raise the facilities alarm yet; first check whether the door
   is open.
2. If it is open, close it and observe the temperature.
3. If it is already closed, call the maintenance electrician.
4. Leave the alarm decision to the person on duty, with emergency
   procedures taking precedence if there is an immediate safety risk.

This example makes the benefit of specialisation tangible: the
receptionist does not need HVAC expertise, while the remote specialist
does not pretend to know the physical door state. It contributes the
runbook and escalation rules; the person on site contributes observation
and judgment.

Introduce a specialist **Facilities / Compliance Agent**.

```text
Facility App → Primary Agent → A2A → Facilities Agent
                    ▲                    │
                    └── recommendation ──┘
                         │
                         ▼
                      Operator
```

Do not teach A2A merely as "Agent A calls Agent B." The value is
**specialisation and organisational boundaries**.

The primary agent knows application/user/incident context. The
specialist knows compliance, safety policy, legal obligations, and
escalation procedures.

The specialist returns a stable case ID and a structured, sourced,
conditional assessment. A2A owns the agent-to-agent delegation and task
lifecycle. The recommendation explicitly distinguishes what is known
(the temperature trend) from what must be checked locally (the door).

The same specialist also exposes its fictional runbook, law, and policy corpus as
MCP resources, a read-only `get_case_analysis` tool, and a portable MCP
App. The MCP App lets the operator explore evidence, provenance, required
actions, and uncertainty without making the primary application own the
specialist's research UI.

```text
Primary Agent ──A2A──> Facilities Agent ──> case ID
Angular/React ──MCP──> resources + tool + MCP App(case ID)
```

This is the key distinction:

> **A2A delegates work to another agent. MCP exposes capabilities,
> resources, and a specialist-owned user interface.**

Mention agent identity, authentication/authorization, trust boundaries,
data minimisation, distributed tracing, provenance, sandboxing, and
timeout/failure handling.

## 13. Cross-cutting guardrail progression

| Capability            | Primary guardrail                                      |
| --------------------- | ------------------------------------------------------ |
| Chat                  | Domain/scope filtering                                 |
| Generated SQL         | Read-only database, validation, allowlists, and limits |
| Other tool calling    | Explicit capability APIs                               |
| Consequential actions | Human approval and audit                               |
| A2UI                  | Trusted component catalogue                            |
| Persistent dynamic UI | Memory/persistence boundaries                          |
| Generative UI         | Sandbox/capability boundary                            |
| A2A                   | Identity, authorization, and trust boundaries          |
| MCP App               | Sandbox, CSP, capability, and origin policy            |

Closing message:

> **As autonomy increases, operational responsibility increases too.**

## 14. Final end-to-end scenario

1.  `cooling-air-temperature` has remained in warning since 12:00 and is
    approaching the adjacent Packaging hall's air temperature.
2.  The night receptionist asks whether an alarm should be raised or a simple
    local check should happen first.
3.  The primary agent sends the telemetry and incident context to the
    facilities/compliance specialist over A2A.
4.  The specialist returns a stable case ID and a sourced conditional
    runbook: check the door; if open, close and observe; if closed, call
    the maintenance electrician.
5.  A2UI renders those steps using the trusted decision component
    catalogue and keeps alarm escalation approval-only.
6.  The receptionist opens the specialist-guidance MCP App for the case
    and can inspect the fictional runbook and alarm policy.
7.  The receptionist approves or rejects alarm escalation; the decision
    and its correlation ID are recorded in the audit trail.

Use this to show that AG-UI, CopilotKit, A2UI, A2A, MCP, and MCP Apps
solve **different problems in one architecture**. Generative UI is the
comparison point, not a hands-on implementation in the three-hour format.

## 15. Standards story

- **AG-UI:** How does a user-facing application communicate with an
  agent?
- **CopilotKit:** How do we integrate agentic interaction conveniently
  into Angular/React?
- **A2UI:** How can an agent compose dynamic UI from trusted
  components?
- **Generative UI:** What happens when predefined components are
  insufficient?
- **A2A:** How can specialist agents collaborate across
  system/organisational boundaries?
- **MCP / MCP Apps:** How does a specialist expose reusable tools,
  evidence, and a portable user interface?

They are complementary, not competing.

## 16. Suggested three-hour timing

| Section                                          | Approx. |
| ------------------------------------------------ | ------: |
| Part 1 app walkthrough                           |  15 min |
| Part 2: basic OpenAI-SDK chat through OpenRouter |  15 min |
| Part 3: migrate the same chat to AG-UI           |  20 min |
| Part 4: Mastra + CopilotKit                      |  20 min |
| Part 5: generated SQL tool                       |  20 min |
| Human-in-the-loop + guardrails                   |  10 min |
| Break/buffer                                     |  10 min |
| A2UI + generative UI comparison                  |  20 min |
| A2A specialist agent                             |  25 min |
| MCP resources, tool, and MCP App                 |  20 min |
| End-to-end wrap-up                               |   5 min |

Rehearse this carefully. The completed reference system should be used
for the final A2A-to-MCP-App path; code-generating UI is reserved for the
two-day expansion.

## 17. Implementation strategy and current status

Use explicit checkpoints/branches rather than continuously mutating one demo.
`main` is the canonical home of the overall project knowledge, workshop plan,
branch map, and handoff documentation. Numbered branches are cumulative,
independently runnable webinar milestones and are never merged. Create each
new numbered branch directly from the previous milestone (`02-basic-chat`
from `01-base-app`, then `03-ag-ui-chat` from `02-basic-chat`, and so on).

| Checkpoint             | Workshop responsibility                                                 | Status                                 |
| ---------------------- | ----------------------------------------------------------------------- | -------------------------------------- |
| `01-base-app`          | Complete conventional incident-management application                   | **Completed; workshop starting point** |
| `02-basic-chat`        | Basic conversation through the OpenAI SDK and OpenRouter; no tools      | Planned                                |
| `03-ag-ui-chat`        | Migrate the same tool-free chat to AG-UI streaming and lifecycle events | Planned                                |
| `04-mastra-copilotkit` | Decoupled Mastra backend and CopilotKit chat; still no tools            | Planned                                |
| `05-sql-tool`          | One generated-SQL historian tool through the standardized stack         | Planned                                |
| `06-human-in-loop`     | Approval-gated alarm actions and correlated audit                       | Planned                                |
| `07-a2ui`              | Trusted, agent-composed decision surface                                | Planned                                |
| `08-a2a`               | Delegate the incident to the facilities/compliance specialist           | Planned                                |
| `09-mcp-app`           | Specialist resources, read-only tool, and portable evidence UI          | Planned                                |
| `final`                | Rehearsed Angular/React golden path and resilience checks               | Planned                                |

Each checkpoint should be runnable independently and include a short
README explaining what changed, why it changed, and what limitation
motivates the next checkpoint.

---

# Ideas for a Full Two-Day Workshop

This section is not a second, fully designed workshop agenda. It collects
candidate topics for turning the three-hour format into a full two-day
workshop.

The longer format should keep the **same narrative backbone** and deepen
the cross-cutting and implementation topics instead of adding unrelated
features. A future two-day design should select and schedule these topics
based on the audience, desired amount of implementation work, and time
available for discussion and exercises.

## A. AG-UI deep dive

Explore protocol/event details, streaming, state synchronisation, custom
backend integration, failure handling, and framework portability.

## B. Memory

Turn memory into a dedicated topic:

- short-term conversation state
- long-term/user memory
- workspace memory
- persistence models
- tenancy and privacy
- retention
- invalidation/versioning
- restoring dynamic UI safely

## C. Security and guardrails

Deepen:

- authentication/authorization
- tool permissions
- least privilege
- prompt/context injection risks
- data boundaries
- tenant isolation
- sandbox capability design
- model abuse/cost controls
- A2A trust

## D. Observability and auditability

Implement traces across model runs, tools, frontend actions, generated
UI, and agent-to-agent calls. Separate debugging/product observability
from accountability/compliance audit records.

## E. RAG for runbooks, laws, regulations, and company policies

Use the incident-response scenario to motivate retrieval.

The specialist facilities/compliance agent should not be assumed to "know" the
current runbook, law, or internal emergency procedures from model weights. It can
retrieve authoritative sources such as:

- facilities troubleshooting runbooks
- legislation/regulations
- safety rules
- company policies
- emergency procedures
- plant-specific operating manuals

This gives RAG a concrete purpose rather than introducing it as another
AI buzzword.

A useful distinction:

> **RAG answers: "What does our authoritative knowledge say?"**\
> **A2A answers: "Which specialist agent should handle this?"**

The two combine naturally:

```text
Primary Incident Agent
        │
       A2A
        ▼
Facilities / Compliance Agent
        │
       RAG
        ▼
Runbooks / Laws / Regulations / Company Policies
```

The specialist agent can return both a recommendation and the
provenance/evidence supporting it.

## F. Advanced natural-language data access

Harden the generated-SQL tool from the three-hour workshop and compare it with
server-owned, parameterized query tools. Cover query parsing, read-only
database access, schema allowlists, validation, execution limits, explain
plans, auditing, and adversarial prompts. Use the same warning-transition and
shift-manager questions so the trade-off is clear without introducing a
second scenario.

## G. Production readiness

The two-day version can close with a production-readiness review
covering security, memory, observability, auditability, evaluation,
failure modes, cost, latency, testing, and deployment boundaries.

## H. MCP Apps and sandboxing deep dive

Build the double-iframe host architecture, inspect MCP App metadata and
CSP, enforce capability/origin policy, handle teardown and resizing, and
test an intentionally hostile app. Compare specialist-owned MCP Apps with
bounded A2UI and sandboxed code-generating UI.

## I. Hands-on generative UI

Implement the code-generating UI path that is intentionally omitted from
the three-hour workshop. Cover code inspection, sandbox construction,
network and storage isolation, resource limits, evaluation, and recovery.

---

# Presenter / Implementation-Agent Guidance

For every phase, implementation work should answer four questions:

1.  **What limitation are we demonstrating?**
2.  **What is the smallest implementation that makes that limitation
    visible?**
3.  **What new concept solves it?**
4.  **What new guardrail becomes necessary because of the added
    autonomy?**

Avoid adding technology merely because it is available. Every framework,
protocol, agent, tool, or UI mechanism must have a clear job in the
incident-management story.

The workshop's strongest narrative is not "look at all these AI
technologies."

It is:

> **Watch one conventional application evolve as we progressively give
> users and agents more expressive power --- without abandoning
> architectural control.**
