# Webinar 06 — Raise an alarm with human approval

**Start:** webinar-05. **Completed:** webinar-06, in
`/Users/rainerh/programming/packt-webinar-02`.

This introduces original milestone 7 before historian queries. Webinar 07 will
introduce original milestone 6 while retaining the approval flow.

## What the presenter adds

1. A list_metrics frontend tool returning metric IDs, names and rooms.
2. A raise_alarm human-in-the-loop registration using alarmApprovalToolSchema
   and the existing AlarmApprovalCard.
3. The prepared webinar-06 prompt file and its import in the Mastra agent.

The approval card, backend endpoint, audit display and refresh subscription are
already present. App HTML, app config and the backend need no edits.
The model has no measurements or reactive context. It proposes an alarm only on
an explicit operator request; the operator approves or rejects it.

## Presenter materials

- [Speaker notes](speaker-notes/06-alarm-approval.md)
- [Demo prompts](demo-prompts.md#06--raise-an-alarm-with-human-approval)
- [Verification](verification-06.md)
- Presenter desk: http://localhost:4400/#06/0

Use `git switch webinar-05` to rehearse and `git switch webinar-06` to recover.
These commands restore files, not Git branches or database state.
