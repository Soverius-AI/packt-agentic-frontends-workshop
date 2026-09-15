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

**Show and explain:** Inspect list_rooms and list_shift_managers calls and compare their returned options with the conventional controls. The handler now requires exact discovered IDs; it does not repair guessed spellings.

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

**Show and explain:** In Studio follow query_historian → SQL generation → review → validation/execution. The application reads the delivered tool result directly into its prepared grid. Show toModelOutput: the model receives only a receipt, with no second display call. Do not promise one row per manager when ties exist.

### 2. Narrow the data question (optional)

**Before:** Continue after the first successful query. Put scope in the question explicitly; do not assume screen filters are automatically included in the SQL request.

> Show the latest ten air temperature readings from the Cooling room.

**Expected:** Up to ten matching complete reading records appear in the Historian result view, ordered by recency as requested.

**Show and explain:** Compare room, metric and timestamps with returned records. Explain that SQL selects records while the application owns the layout.

### 3. Expose the fixed result shape

**Before:** Use the completed milestone 06 implementation, which accepts complete reading records rather than computed summaries.

> Show me the average air temperature for each shift manager.

**Expected:** The workflow should reject the unsupported aggregate request and the assistant should explain why. It must not fabricate averages or render a new result. An earlier result grid may remain visible.

**Show and explain:** Inspect the rejection in the workflow trace. If the model refuses before calling the tool, explain that this shows instruction-following only; open the workflow guard to show the enforced boundary. Use this limitation to introduce the A2UI chapter 08.

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

## 08 — A2UI result composition

[Speaker notes](speaker-notes/08-a2ui.md)

### 1. Only a table

**Before:** Complete 08, restart both backend services and reload the app. Ensure the local historian contains readings from the last seven days. If needed, stop services and deliberately reset the demo database before rehearsal.

> Show the Cooling room air temperature readings from the last seven days. Include time, temperature and shift manager, in that order. Only show a table, with no cards or explanatory text.

**Expected:** The Generated view shows a standalone Table with Time, Temperature and Shift Manager in that order. Paging is local. No surrounding titled Card, explanatory Text or column chooser.

**Show and explain:** Inspect the query and result-format decision, then the validated Table definition and real dataset binding. Relative dates stay in the original question until SQL resolves them using the database clock.

### 2. Manager cards containing room tables — rehearse first

**Before:** Rehearse this complex example before teaching it. In the 15 September Workshop check, both the original and clarified prompts produced structurally valid layouts that missed the requested manager-card/room-table arrangement. Continue after the table demo and compare the result with the expected hierarchy; do not count rendering alone as success.

> Show air temperature readings from both rooms over the last seven days. Create one card per shift manager, titled with the manager's name. Inside EACH manager card put one short layout introduction and TWO separate tables: one for the Cooling room and one for the Packaging hall. Title each table with its room name. Each table must contain only readings for its own room and that card's manager, with time and temperature columns. Do not combine both rooms into one table.

**Expected:** For complete seeded coverage, three titled manager Cards contain three Text introductions and six room Tables. Each table receives only its manager/room group. A new result replaces the previous view.

**Show and explain:** Compare one table with its returned records, then page only that table and check the others stay put. Explain native repeated child templates and dataset bindings. The short introduction describes layout, not unseen measurements. A schema-valid composition can still miss the requested layout. Count the separate room tables and check their titles before calling the demo successful.

### 3. Room cards without tables

**Before:** Continue after the manager-card demo. The historian view includes stored room descriptions and area types.

> Give me an overview of the rooms. Show one card per room, with its name as the title and one short explanation of what happens there. Use the stored room descriptions. No tables or temperature statistics.

**Expected:** Two Cards with Text replace the previous tables. Room names and descriptions come from the dataset; no temperature table is generated.

**Show and explain:** Follow Text and title bindings into stored metadata. Contrast this composition with the first two examples: the same catalogue supports a standalone table, nested tables and text-only cards.

### 4. Revisit the earlier aggregate limitation (optional)

**Before:** Optional after the three core demos. Explicitly request a table so the format agent selects UI.

> Show the average air temperature for each shift manager over the last seven days in a table.

**Expected:** A supported aggregate result is displayed in a Table, using data or calculations from the complete query snapshot. No model-invented averages.

**Show and explain:** Contrast with 06. Inspect the generated SQL: it may return named aggregate columns or underlying readings with a Table aggregate configuration. Verify values against the dataset; paging must not change an average.

### 5. Expose the read-only boundary (optional)

**Before:** Optional boundary example. This is intentionally unsupported; the model has no deletion tool and SQL execution is read-only.

> Delete all Cooling room readings from the historian, then show a table of the remaining readings.

**Expected:** No readings are deleted. The main agent should refuse, or the workflow should reject any proposed write. If it instead performs only a read, explain that the requested deletion was not available.

**Show and explain:** Inspect where the request stopped. A refusal alone tests instructions; the deterministic suite separately verifies blocked writes. Do not modify the policy to force a demo through.

## Later milestones

A2UI is included in milestone 08. A2A and MCP demos will be added when their implementations are ready.
