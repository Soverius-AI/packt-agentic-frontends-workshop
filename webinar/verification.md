# Webinar chapter 3 verification — 15 September 2026

## Saved implementation

Commit `5d9afdc` preserves the presenter's chapter-3 implementation as written.
The current directory remains `packt-webinar-02`, with branch `webinar-03` checked out.
The original webinar-02 branch remains the Basic Chat checkpoint. Shared container
CSS is committed in webinar-01 and webinar-02. No application code was rewritten
while preparing chapter 3 notes or tests.

## Current checks

The suite covers conventional facility data, forwarding to the Copilot listener,
discovery of the real BuiltInAgent named default, filter preservation, historian
policy and approval/replay behavior. Recovery tests exercise 01 → 02 → 03 → 02 →
01 → 03, creation and deletion of files, backups including absent paths, and
validation before any writes. Presenter checks compare all completed code and
file-deletion markers with the saved snapshots.

Basic Chat API tests and their model-response helper were removed from webinar-01,
webinar-02 and webinar-03 at the presenter's request. The inherited workshop server
test delegates to the same maintained suite. No model call is made by these tests.
The chapter-3 discovery check uses the real runtime and a placeholder key locally.

## Results

- webinar-01: eight remaining tests passed after removing Basic Chat API tests.
- webinar-02: the same test-removal commit is included; no application changes.
- webinar-03: nine tests passed, including real CopilotKit agent discovery.
- The facility TypeScript build and Angular production build passed on webinar-03.
- Recovery status identifies 03 and presenter data contains three chapters,
  30 action cards, four demo prompts, and all nine chapter-3 file changes.

## Rehearsal

Run the two chapter-3 demo prompts with your configured model. Streaming was
observed during the presenter's earlier manual run; discovery checks do not
verify model generation or the quality of an answer. The private .env stays ignored.
Ports: Angular 4200, facility backend 3101, Mastra API 4211, Studio 4212, notes 4400.
Mastra is not needed for chapter 3. Restart the backend launcher after source edits.

Chapter 4 is the next preparation step. Existing milestone branches were not changed.
