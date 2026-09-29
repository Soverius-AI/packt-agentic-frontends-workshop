# Shared Angular refactor

The refactor originates on `ai-devcraft/02-backend-agents` and is merged into `ai-devcraft/03-agentic-ui`. The numeric prefixes match presentation chapters; chapter 01 is Agentic Coding.

## Backend-only foundation

- Strict Angular production build passed.
- ESLint, Sheriff layer checks, and six Angular tests passed.
- The plain query form tests cover successful result handoff and reviewer rejection.
- All Angular components use inline templates and component-owned styles; reusable Sass stays in one shared partial.
- No CopilotKit or AG-UI dependencies appear in application package manifests or the resolved lockfile, and no integration appears in Angular source.

The original chapter 3 refactor is recoverable on `backup/03-angular-refactor-before-base-move`. These are local changes; no branch has been pushed.

## Agentic UI merge

- Chapter 3 merges the chapter 2 refactor, retaining its single-file components and domain layers.
- CopilotKit context/tools, chat, progress, and human approval live in the feature's `agent` folder.
- Strict Angular production build, ESLint/Sheriff, and seven Angular tests passed after resolving the merge.
- The extra test covers the authoritative alarm-decision result. Live chat and approval were not re-rehearsed during this branch reorganization.
