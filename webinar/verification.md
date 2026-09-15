# Webinar chapter 4 verification — 15 September 2026

## Saved implementation

Commit `ed3982f` preserves the presenter’s four changed application files exactly
as written: Mastra’s agent and index, the facility Copilot runtime factory and
main. The active directory remains `packt-webinar-02`, now on `webinar-04`.
No application cleanup was applied while preparing notes and tests. Unused imports
and legacy ChatService declarations remain; they are not additional teaching steps.

The chapter-3 AG-UI Chrome extension reminder is committed on `webinar-03` as
`8a4c52c` and inherited by `webinar-04`. Earlier original milestone branches were
not modified. Nothing was pushed.

## Automated checks

- Facility backend, common and contracts builds passed.
- Mastra TypeScript check passed.
- All nine webinar tests passed, including real Mastra adapter discovery through
  the facility listener without a model call.
- Recovery exercised 01 → 02 → 03 → 04 → 03 → 02 → 01 → 04 → 03 in a temporary
  directory, including file additions/deletions, backups and validation before writes.
- Recovery includes the two Mastra files. The older checkpoints restore the empty
  agent file and unregistered index; chapter 4 restores the completed integration.
- Presenter checks cover exact snapshots, four chapter-4 changed files, and the
  required chapter-3 Chrome extension and chapter-4 Studio reminders.
- Recovery status identifies `04: Mastra agent and Studio`.
- Generated presenter data contains four chapters, 45 action cards and six prompts.

Basic Chat API tests remain removed. The Angular source is unchanged from chapter
3, so its production build was not repeated for this backend/documentation change.

## Live verification

A single general-knowledge request was sent through the running facility backend’s
`/api/copilotkit/agent/default/run` endpoint to the configured Mastra agent.
The response was HTTP 200 and included RUN_STARTED, TEXT_MESSAGE_START,
TEXT_MESSAGE_CONTENT, TEXT_MESSAGE_END and RUN_FINISHED, with no RUN_ERROR.
The answer explained temperature control in chocolate production.
This verifies the backend → adapter → Mastra → model stream. It was an HTTP check,
not a new Angular browser chat test or a model-quality evaluation.

Mastra Studio on localhost:4212 loaded successfully, listed Soverius Chocolate
Factory, and showed the matching one-sentence chocolate question in Traces with
status OK. The required Studio demonstration is supported by the prepared tracing
configuration. Credentials were not displayed or committed.

The running presenter desk on localhost:4400 was refreshed and inspected: it shows
chapter 4, both demo prompts and exactly four changed files.

## Rehearsal

Start a fresh Angular conversation and follow both chapter-4 prompts. First show
the agent in Studio and try the general-knowledge question; then send the question
from Angular and identify its corresponding trace. Finally ask for a current
Cooling-room temperature and explain why an agent with no tools cannot access it.
That second model-behavior demonstration was not run as part of the live check.

Ports: Angular 4200, facility backend 3101, Mastra API 4211, Studio 4212, notes 4400.
Restart the backend launcher after source edits; Mastra watches its source.
