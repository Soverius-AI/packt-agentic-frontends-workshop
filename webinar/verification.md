# Webinar verification — 15 September 2026

## Preserved working reference

Commit `1a9e25e` on `webinar-01` records the presenter's working milestone-02
implementation, including the common package, environment setup, server options
object and frontend response adapter. Preparation is a later commit on this new
branch. The original Workshop branch and its uncommitted changes were compared
against saved hashes after preparation and are unchanged. The inherited
`workshop/` files, including all milestone solutions, also compare unchanged.

## Checked

- `pnpm webinar:test`: 9 tests passed, including the server parent test.
- The test loads the actual completed `webinar/solutions/02/.../chat.ts` factory,
  substitutes only the HTTP response from OpenRouter, and verifies the model,
  static system prompt, conversation, raw assistant response and Angular wrapper.
- The prepared server supports disabled chat, the existing Copilot listener,
  filter preservation, historian read-only rules and approval/replay behavior.
- Selector tests exercise `01 → 02 → 01`, backups of all three files, rejection of
  unsupported states, preservation of other files, and failure before writes when
  a solution file is missing.
- Generated presenter data has states 01 and 02, 16 actions, two demo prompts and
  exactly three completed-code diffs. The inline browser script parses.
- State 01 passed the full `check:types` command: common/contracts, facility
  backend, Mastra TypeScript and Angular production build.
- State 02 passed the facility build and Angular production build. The new
  worktree was then restored to 01 and its backend rebuilt.
- The browser presenter desk at port 4400 was refreshed and inspected: it shows
  the new branch, correct states, three files and the actual OpenAI factory diff.

Angular reports an unused-component warning in each state because both
ChatComponent and BasicChatComponent are intentionally imported beforehand. This
keeps app.ts out of the live edits; the warning does not block either build.

These checks made no external model calls and did not reset the existing demo
database. The working chat was previously exercised by the presenter in Workshop;
rehearse the actual demo prompts after starting this new worktree's backend.

## Runtime handover

The presenter server on 4400 now serves this worktree. The previously running
application services were not stopped or moved. Stop their old terminals before
starting the new worktree on 4200 / 3101 / 4211 / 4212. The private .env has been
copied to this worktree and remains ignored and permission-restricted.

## Scope

Only webinar states 01 and 02 are prepared in this branch's selector. Later
milestone implementations remain available in the original branches and their
unchanged reference files. Do not use the inherited selector to overwrite this
new backend; the root workshop commands point to the webinar equivalents.

## Test scope update

Basic Chat API tests and their model-response helper have been removed at the
presenter's request. The earlier Basic Chat assertions above describe historical
verification only. Current tests retain facility, Copilot routing and presenter
recovery checks. The inherited workshop server test delegates to that same suite.
