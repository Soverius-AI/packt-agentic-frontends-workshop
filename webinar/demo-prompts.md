# Demo prompts for the presenter

<!-- Generated from demo-prompts.json. Edit that file, then run pnpm webinar:notes:build. -->

Type these questions into the application chat after completing the named milestone. These are demo inputs; the agent instruction prompts live in the source files listed in the presenter guide.

Follow the numbered order within each milestone; optional entries can be skipped. Before changing milestones, restart affected services, reload the app and start a fresh conversation. Selecting a checkpoint changes code only, not conversations, stored readings or alarms.

Rehearse against your configured model before the workshop. The expected results below are acceptance criteria checked against the code, not a record of successful live model runs. If a request fails, inspect the tool call or trace rather than treating a confident chat reply as evidence.

## 01 — Webinar starting state

[Speaker notes](speaker-notes/01-start.md)

There is no chat in this milestone. Tour the snapshot, reading log, filters and conventional alarm controls. Establish which state the application already owns before connecting an assistant.

## 02 — Basic Chat — completed

[Speaker notes](speaker-notes/02-basic-chat.md)

### 1. General knowledge

**Before:** Complete milestone 02: activate the prepared BasicChatComponent, implement createChatClient in chat.ts and enable the backend chat service. Restart the backend launcher, reload the app and start a fresh conversation.

> Why does temperature control matter when making chocolate?

**Expected:** An ordinary explanation based on general knowledge, without claiming to have inspected this factory.

**Show and explain:** Trace POST /api/chat to the OpenAI client and completion call written live in chat.ts. Explain that conversation works before facility access exists.

### 2. Expose the missing data connection

**Before:** Keep the same conversation. Do not paste readings into the chat.

> What is the current air temperature in our Cooling room?

**Expected:** The assistant should explain that it cannot access current facility readings. Any invented temperature is a failed demonstration, not evidence of access.

**Show and explain:** Compare with the real snapshot. The backend route supplies no facility tools or live readings.

## 03 — CopilotKit and AG-UI

[Speaker notes](speaker-notes/03-copilotkit.md)

### 1. Streaming conversation

**Before:** Complete chapter 03, restart the backend launcher, and reload Angular at localhost:4200. Open the AG-UI Chrome extension panel again before sending the prompt.

> Why does temperature control matter when making chocolate?

**Expected:** The answer arrives progressively and uses general knowledge, without claiming access to this factory.

**Show and explain:** Show the AG-UI Chrome extension again: run-start, text-delta and run-finish events. Inspect /api/copilotkit requests and the AG-UI run-start, text-delta, and run-finish events. Compare with the single JSON response in chapter 02.

### 2. No frontend tools yet

**Before:** Keep the snapshot or reading log visible and note the current filters.

> Show only warnings from the Cooling room.

**Expected:** The application filters remain unchanged. The model has no frontend tools; a textual claim of success is not an application action.

**Show and explain:** Show that BuiltInAgent has a model and static prompt, with no tools connected. Mastra is introduced in chapter 04.

## 04 — Mastra agent and Studio

[Speaker notes](speaker-notes/04-mastra.md)

### 1. One agent, two entry points

**Before:** Start Mastra API on 4211 and Studio on 4212. Show the default agent in Studio and try the prompt there. Restart the chapter-4 backend, then send the same prompt in a fresh Angular conversation on 4200.

> Why does temperature control matter when making chocolate?

**Expected:** Both entry points produce a general explanation. Angular streams through CopilotKit to the Mastra agent. Neither answer claims to inspect live factory data.

**Show and explain:** Required: show Mastra Studio, its agent model and instructions, then the trace corresponding to the Angular request. Also show the unchanged CopilotChat and the new MastraClient adapter.

### 2. Hosting does not grant data access

**Before:** Keep the actual facility snapshot visible. Do not paste readings into chat.

> What is the current air temperature in our Cooling room?

**Expected:** The assistant should explain that it cannot access current readings. An invented temperature fails this demonstration.

**Show and explain:** Show tools: {} in the Mastra agent and the static prompt. Explain that frontend tools are introduced in chapter 5.

## 05 — Frontend tools

[Speaker notes](speaker-notes/05-frontend-tools.md)

### 1. Discover options through Angular

**Before:** Open a fresh Angular conversation on 4200 after completing chapter 5. Show the AG-UI Chrome extension.

> Which rooms and shift managers are available?

**Expected:** Calls list_rooms and list_shift_managers and reports only the names returned by Angular.

**Show and explain:** Show empty input objects, array results and the matching manual filter options. This uses tool results, not reactive agent context.

### 2. Operate the existing controls

**Before:** Keep the previous conversation so discovered IDs are available. Keep the view buttons and filters visible.

> Switch to the reading log and show only warnings from the Cooling room managed by Charles Bond.

**Expected:** The reading log is selected and room, manager and warning filters match the request. Existing unrelated filters are preserved.

**Show and explain:** Inspect set_view and set_filter_values, their returned results, and the actual controls. Compare handlers with the methods used by the template.

### 3. Change one date without losing other filters

**Before:** Keep the room, manager and warning filters from the previous demo.

> Change only the start date to now.

**Expected:** Only the start boundary changes to the browser current time. No matching readings is a valid result.

**Show and explain:** The tool arguments omit unrelated fields. Angular preserves them and resolves the now convention.

### 4. Clear exactly one field

**Before:** Keep the other filters selected.

> Clear only the start date.

**Expected:** The start date clears; room, manager and condition remain selected.

**Show and explain:** Show from: null and explain that null clears that field while omission preserves the others.

### 5. Tools still have a data boundary

**Before:** Keep actual readings visible but do not paste them into chat. Open Mastra Studio on 4212 to inspect an Angular trace.

> What is the current air temperature in our Cooling room?

**Expected:** The assistant explains that it cannot read measurements with these tools.

**Show and explain:** Show the Angular request trace in Studio. Room and manager discovery plus UI control do not grant historian access; Studio standalone chat has no Angular handlers.

## 06 — Raise an alarm with human approval

[Speaker notes](speaker-notes/06-alarm-approval.md)

### 1. Discover the exact metric

**Before:** Complete chapter 06, wait for Angular and Mastra to reload, and start a fresh Angular conversation on 4200. Open the AG-UI Chrome extension. Clear old filters and select Snapshot.

> Which metrics are available in the Cooling room?

**Expected:** Calls list_metrics and reports metrics belonging to the Cooling room using the returned names. It makes no measurement claims.

**Show and explain:** Show the returned exact metric IDs, names and room names. The handler returns options, not readings.

### 2. Reject an alarm proposal

**Before:** Use a target without an active alarm. If necessary, use the existing manual acknowledge/resolve controls. Keep Snapshot and the audit visible.

> Raise an alarm for the Cooling room air temperature because I observed a cooling failure.

**Expected:** The raise_alarm tool renders a proposal card. No alarm is created before approval. Click Reject: the audit records rejected and not-executed; the assistant acknowledges rejection without retrying.

**Show and explain:** Show the tool arguments and the operator decision separately. Inspect the correlation ID and authoritative outcome in the audit and tool result.

### 3. Approve and verify execution

**Before:** Repeat the request after rejection. Confirm the target still has no active alarm. Click Approve and raise alarm on the new proposal.

> Raise an alarm for the Cooling room air temperature because I observed a cooling failure.

**Expected:** The alarm appears in Snapshot. The audit records approved, executed and the created alarm ID; the assistant confirms the returned outcome. A failed execution must be reported as a failure.

**Show and explain:** Show the AG-UI result and the Angular request trace in Mastra Studio on 4212. Compare the trace with the durable facility audit. Selecting a checkpoint does not undo this alarm.

## Later milestones

A2UI is included in milestone 08. A2A and MCP demos will be added when their implementations are ready.
