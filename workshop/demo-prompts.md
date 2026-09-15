# Demo prompts for the presenter

<!-- Generated from demo-prompts.json. Edit that file, then run pnpm workshop:notes:build. -->

Type these questions into the application chat after completing the named milestone. These are demo inputs; the agent instruction prompts live in the source files listed in the presenter guide.

Follow the numbered order within each milestone; optional entries can be skipped. Before changing milestones, restart affected services, reload the app and start a fresh conversation. Selecting a checkpoint changes code only, not conversations, stored readings or alarms.

Rehearse against your configured model before the workshop. The expected results below are acceptance criteria checked against the code, not a record of successful live model runs. If a request fails, inspect the tool call or trace rather than treating a confident chat reply as evidence.

## 01 — Conventional application

[Speaker notes](speaker-notes/01-conventional-app.md)

There is no chat in this milestone. Tour the snapshot, reading log, filters and conventional alarm controls. Establish which state the application already owns before connecting an assistant.

## 02 — Basic chat

[Speaker notes](speaker-notes/02-basic-chat.md)

### 1. General knowledge

**Before:** Complete milestone 02. Open the native chat and start a fresh conversation.

> Why does temperature control matter when making chocolate?

**Expected:** An ordinary explanation based on general knowledge, without claiming to have inspected this factory.

**Show and explain:** Point to the chat request and response. Explain that conversation works before facility access exists.

### 2. Expose the missing data connection

**Before:** Keep the same conversation. Do not paste readings into the chat.

> What is the current air temperature in our Cooling room?

**Expected:** The assistant should explain that it cannot access current facility readings. Any invented temperature is a failed demonstration, not evidence of access.

**Show and explain:** Compare with the real snapshot. The backend route supplies no facility tools or live readings.

## 03 — CopilotKit and AG-UI

[Speaker notes](speaker-notes/03-copilotkit.md)

### 1. Show streaming in CopilotChat

**Before:** Complete milestone 03, restart the facility service and reload the app. Use a fresh conversation.

> Why does temperature control matter when making chocolate?

**Expected:** A general answer arrives through CopilotChat and the embedded agent runtime. Exact chunk timing depends on the model.

**Show and explain:** Open the browser network stream. Trace the request through the Copilot runtime and AG-UI lifecycle events.

### 2. Introduce the future frontend tool demo

**Before:** Clear filters manually first. There are no frontend tools in this checkpoint.

> Show only warnings from the Cooling room.

**Expected:** Filters stay unchanged. The assistant should acknowledge that it cannot operate the interface yet.

**Show and explain:** Point to the unchanged filters. Save this request to repeat after milestone 05.

## 04 — Mastra agent

[Speaker notes](speaker-notes/04-mastra.md)

### 1. Follow one request into Mastra

**Before:** Complete milestone 04. Start Mastra, restart the facility service, reload the app and use a fresh conversation. Open Studio on port 4211.

> In one sentence, why is humidity relevant in a chocolate factory?

**Expected:** A short general answer in the app, with the corresponding run visible in Mastra Studio.

**Show and explain:** Find this exact question in the trace. Walk from the Angular chat through the runtime bridge to the main agent.

### 2. An agent still needs data access (optional)

**Before:** Stay in milestone 04. Do not provide a temperature in the conversation.

> What is the current air temperature in our Cooling room?

**Expected:** Moving the agent to Mastra does not give it readings. It should explain the missing access.

**Show and explain:** Show the tool-free agent factory before introducing frontend tools.

## 05 — Frontend tools

[Speaker notes](speaker-notes/05-frontend-tools.md)

### 1. Discover valid application options

**Before:** Complete milestone 05, restart/reload and start a fresh conversation. Clear filters manually.

> Which rooms and shift managers can I filter by?

**Expected:** Room and manager names come from discovery tools rather than guesses.

**Show and explain:** Inspect list_rooms and list_shift_managers calls and compare their returned options with the conventional controls.

### 2. Repeat the previously impossible request

**Before:** Continue after discovery with empty filters.

> Show only warnings from the Cooling room.

**Expected:** The room and condition filters change. An empty grid is valid if the current data contains no matching readings.

**Show and explain:** Compare with milestone 03. Inspect discovery as needed and update_filters; the Angular handler performs the state change.

### 3. Change view and combine filters

**Before:** Continue in the same conversation. Leave date boundaries empty.

> Switch to the reading log and show only warnings from the Cooling room managed by Charles Bond.

**Expected:** The reading log opens with the requested room, condition and manager selected. The number of rows depends on recorded data.

**Show and explain:** Show set_view and update_filters, then point to the corresponding controls.

### 4. Patch one field

**Before:** Keep the room, condition and manager from the previous prompt.

> Change the start date to now.

**Expected:** The start boundary changes; the existing room, condition and manager remain. Few or no rows immediately after now are expected.

**Show and explain:** Point to the browser-resolved start time and unchanged filters. Explain omitted fields versus changed fields.

### 5. Clear one field

**Before:** Continue immediately after setting the start date.

> Clear only the start date. Keep all other filters as they are.

**Expected:** Only the start boundary is cleared; room, condition and manager remain selected.

**Show and explain:** Inspect the null boundary in update_filters and compare all other filter controls.

### 6. Clarify an ambiguous request (optional)

**Before:** Ensure both date boundaries are empty. Keep the other filters selected.

> Change the date to now.

**Expected:** The assistant should ask whether you mean the start or end date. Answer: The end date.

**Show and explain:** Explain why the model needs clarification before choosing a boundary. Verify unrelated filters survive.

### 7. Reset the demonstration

**Before:** Run after the filter sequence, including any optional prompt.

> Clear all filters and switch to the snapshot view.

**Expected:** All filter values clear and the snapshot view opens.

**Show and explain:** Show clear_filters and set_view. This prepares a clean visible state for the next chapter.

## 06 — Reviewed historian workflow

[Speaker notes](speaker-notes/06-historian.md)

### 1. Select records through the reviewed workflow

**Before:** Complete milestone 06, restart/reload and use a fresh conversation. Ensure the historian contains readings; no dates or specific temperatures are assumed.

> Show me the maximum air temperature for each shift manager.

**Expected:** The reviewed workflow returns complete stored reading records and the prepared Historian result view displays them. Empty or truncated results must be reported honestly.

**Show and explain:** In Studio follow query_historian → SQL generation → review → validation/execution. Then inspect show_historian_readings and the fixed result grid. Do not promise one row per manager when ties exist.

### 2. Narrow the data question (optional)

**Before:** Continue after the first successful query. Put scope in the question explicitly; do not assume screen filters are automatically included in the SQL request.

> Show the latest ten air temperature readings from the Cooling room.

**Expected:** Up to ten matching complete reading records appear in the Historian result view, ordered by recency as requested.

**Show and explain:** Compare room, metric and timestamps with returned records. Explain that SQL selects records while the application owns the layout.

### 3. Expose the fixed result shape

**Before:** Use the completed milestone 06 implementation, which accepts complete reading records rather than computed summaries.

> Show me the average air temperature for each shift manager.

**Expected:** The workflow should reject the unsupported aggregate request and the assistant should explain why. It must not fabricate averages or render a new result. An earlier result grid may remain visible.

**Show and explain:** Inspect the rejection in the workflow trace. If the model refuses before calling the tool, explain that this shows instruction-following only; open the workflow guard to show the enforced boundary. Use this limitation to introduce the later A2UI topic.

## 07 — Human approval and audit

[Speaker notes](speaker-notes/07-approval.md)

### 1. Reject a proposed action

**Before:** Complete milestone 07, restart/reload and use a fresh conversation. Ensure this metric has no active alarm; resolve any previous demo alarm with the conventional UI.

> Raise an alarm for the Packaging hall package reject rate because I want it investigated.

**Expected:** An approval card shows the exact metric, reason and operator. Click Reject. No alarm is raised, and the audit records the rejected decision.

**Show and explain:** Pause before clicking: the model has proposed, not executed. After rejection inspect the audit and the assistant response. This request is your reason for investigation, not proof of an abnormal reading.

### 2. Approve and verify execution

**Before:** Repeat the request after rejecting it. Ensure the metric still has no active alarm. A new proposal has a new correlation ID.

> Raise an alarm for the Packaging hall package reject rate because I want it investigated.

**Expected:** Click Approve and raise alarm. Verify the actual alarm and the executed outcome in the audit. Approval alone is not proof of successful execution.

**Show and explain:** Follow the card into the facility decision API and correlated audit. If execution fails, show the failure honestly. Finish by acknowledging and resolving the demo alarm through conventional controls.

### 3. Show the action boundary (optional)

**Before:** Optional: run while the approved demo alarm is still active, before manual cleanup.

> Resolve the alarm for the Packaging hall package reject rate.

**Expected:** The assistant should explain that resolving alarms remains a conventional operator action in this checkpoint.

**Show and explain:** Use the normal acknowledge/resolve controls yourself, then confirm the alarm state. Distinguish the one exposed action from unrestricted operational access.

## Later milestones

A2UI, A2A and MCP demos will be added when their implementations are ready. The aggregate refusal in milestone 06 is the setup for discussing why a fixed reading grid eventually becomes limiting.
