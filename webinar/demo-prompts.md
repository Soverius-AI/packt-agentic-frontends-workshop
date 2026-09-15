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

**Show and explain:** Trace POST /api/chat to the OpenAI client and completion call written live in basic-chat-model.ts. Explain that conversation works before facility access exists.

### 2. Expose the missing data connection

**Before:** Keep the same conversation. Do not paste readings into the chat.

> What is the current air temperature in our Cooling room?

**Expected:** The assistant should explain that it cannot access current facility readings. Any invented temperature is a failed demonstration, not evidence of access.

**Show and explain:** Compare with the real snapshot. The backend route supplies no facility tools or live readings.

## Later milestones

A2UI is included in milestone 08. A2A and MCP demos will be added when their implementations are ready.
