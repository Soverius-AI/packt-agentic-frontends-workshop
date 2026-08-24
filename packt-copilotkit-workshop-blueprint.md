# Packt Three-Hour Workshop Blueprint --- Building Agentic UIs with Angular & React

**Primary format:** 3-hour Packt workshop\
**Presenters:** Rainer Hahnekamp & Murat Sari\
**Purpose:** Canonical design and implementation plan for the three-hour
workshop, followed by ideas for expanding the same material into a full
two-day workshop.

## How to use this document

Sections 1--18 define the complete three-hour workshop: its narrative,
scenario, concepts, guardrails, timing, and implementation checkpoints.
They are the primary deliverable and should be detailed enough to guide
both presenters and implementation agents.

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

The application represents a facilities dashboard. Its first
deterministic incident is `ROOM-3-HVAC`: the room temperature has risen
for 30 minutes and now matches the outside temperature, while the door
state is unknown.

The Angular/React frontend initially contains a conventional incident
card, the known telemetry, and a **Raise facilities alarm** action. The
state is local and deterministic. No backend or AI is involved yet.

## 3. Autonomy model

Use a recurring visual with:

- **X-axis:** developer control → AI/user autonomy
- **Y-axis:** static UI → dynamic UI

Stage UI Autonomy

---

Traditional app Static Very low
Chat/querying Static Low
Tool calling Static Medium
A2UI Dynamic, constrained Medium/high
Generative UI Highly dynamic High

The developer never simply "gives up control." Control moves from
defining every screen to defining tools, permissions, approval
boundaries, component catalogues, execution environments, capability
APIs, and policies.

## 4. Phase 1 --- Application walkthrough

Show the Angular and React versions of the same deterministic facilities
screen, inspect the shared domain contract, and trigger the manual alarm
action.

```text
Shared incident contract
          │
          ├──> Angular
          └──> React
                  │
                  ▼
        Predefined alarm action
```

Key message:

> **Traditional applications let users do what developers anticipated.
> AI lets users express intent that developers did not necessarily
> anticipate as a specific screen or control.**

This limitation motivates AI.

## 5. Phase 2 --- AI without CopilotKit or AG-UI

Add a chat/sidebar beside the grid. Send user text to the Node backend
and use an LLM SDK directly.

Example: "Should I raise the alarm, or is there something simple I
should check first?"

Two intents matter:

1.  **Data/UI manipulation:** the request can highlight or filter the
    affected facility.
2.  **Question answering:** the response can explain what the person on
    duty should check before escalating. The answer stays in chat.

This phase is **already agentic**. Later, CopilotKit/AG-UI do not create
agency for the first time; they make the integration standardized and
structured.

Prefer safe application capabilities over arbitrary model-generated SQL,
e.g. `searchMachines({ alarmSince, orderBy })`. If SQL generation is
shown, use read-only credentials, schema restrictions, validation,
limits, and sanitisation/review.

### First guardrails

Introduce conversation scope immediately. The industrial assistant
should reject unrelated general-chat use, control cost, and protect the
application's purpose.

Discuss system instructions, domain/intent filtering, rate limits, token
budgets, quotas, monitoring, and logging.

Basic short-term conversation memory can be mentioned here: enough
context for follow-ups, with deliberate retention boundaries.

## 6. Phase 3 --- The plumbing problem

As requirements grow, the hand-built integration must handle streaming,
tool calls/results, frontend actions, state, errors, progress, lifecycle
events, and human approval.

Ask:

> **Why are we designing our own frontend-to-agent protocol?**

This motivates AG-UI.

## 7. Phase 4 --- AG-UI

Present AG-UI as the standard communication layer between agentic
backends and user-facing applications. Streaming is the initial hook,
not the entire story.

First argument:

> **Plumbing:** stop implementing infrastructure conventions ourselves.

```text
Before: Angular/React → Custom Protocol → Node + LLM SDK
After:  Angular/React → AG-UI → Agent Backend
```

## 8. Phase 5 --- Backend decoupling

Start with embedded Node + LLM SDK, then migrate the agent
implementation to **Mastra** (while mentioning alternatives such as ADK
or LangGraph).

The frontend contract should remain conceptually stable.

Second argument:

> **Decoupling:** the frontend is not tightly coupled to one agent
> framework.

The two explicit AG-UI/CopilotKit arguments are therefore **plumbing**
and **decoupling**.

## 9. Phase 6 --- CopilotKit and structured frontend tools

Possible tools include `setMachineFilter`, `selectMachine`, and
`triggerAlarm`.

```text
Agent → CopilotKit → Angular/React Tool → Store → UI
```

Narrative correction: this is not the first agentic moment. The
hand-built version already acted on the application. The improvement is
a **standardized, structured, reusable integration**.

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

## 10. Deterministic UI checkpoint

Pause and classify the system. AI can change data and trigger
developer-defined flows, but developers still created the grid, dialogs,
sidebar, controls, and layout.

> **The behaviour is dynamic; the presentation is still deterministic.**

This motivates A2UI.

## 11. Phase 7 --- A2UI

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

## 12. Phase 8 --- Generative UI

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

## 13. Phase 9 --- A2A, MCP Apps, and specialist agents

Use a room air-conditioning anomaly as the primary A2A scenario. The
room temperature has risen continuously for 30 minutes and now matches
the outside temperature. The person on the night shift may be a
receptionist rather than a trained facilities engineer.

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

## 14. Cross-cutting guardrail progression

Capability Primary guardrail

---

Chat domain/scope filtering
Data queries restricted data tools
Tool calling explicit capability APIs
Consequential actions human approval + audit
A2UI trusted component catalogue
Persistent dynamic UI memory/persistence boundaries
Generative UI sandbox/capability boundary
A2A identity, authorization, trust boundaries
MCP App sandbox, CSP, capability and origin policy

Closing message:

> **As autonomy increases, operational responsibility increases too.**

## 15. Final end-to-end scenario

1.  `ROOM-3-HVAC` reports that its room temperature has risen for 30
    minutes and now matches the outside temperature.
2.  The night receptionist asks whether an alarm should be raised.
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

## 16. Standards story

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

## 17. Suggested three-hour timing

Section Approx.

---

Intro + app walkthrough 15 min
Raw AI integration + plumbing problem 20 min
AG-UI 25 min
Mastra + CopilotKit 20 min
Human-in-the-loop + guardrails 15 min
Break/buffer 10 min
A2UI + generative UI comparison 25 min
A2A specialist agent 25 min
MCP resources, tool, and MCP App 20 min
End-to-end wrap-up 5 min

Rehearse this carefully. The completed reference system should be used
for the final A2A-to-MCP-App path; code-generating UI is reserved for the
two-day expansion.

## 18. Implementation strategy

Use explicit checkpoints/branches rather than continuously mutating one
demo:

```text
01-base-app
02-ai-chat
03-agui
04-mastra
05-copilotkit-tools
06-human-in-loop
07-a2ui
08-a2a
09-mcp-app
10-final
```

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

## F. Production readiness

The two-day version can close with a production-readiness review
covering security, memory, observability, auditability, evaluation,
failure modes, cost, latency, testing, and deployment boundaries.

## G. MCP Apps and sandboxing deep dive

Build the double-iframe host architecture, inspect MCP App metadata and
CSP, enforce capability/origin policy, handle teardown and resizing, and
test an intentionally hostile app. Compare specialist-owned MCP Apps with
bounded A2UI and sandboxed code-generating UI.

## H. Hands-on generative UI

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
