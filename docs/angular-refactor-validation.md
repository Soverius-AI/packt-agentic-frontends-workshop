# Shared Angular refactor

The refactor originates on `ai-devcraft/02-backend-agents` and is merged into `ai-devcraft/03-agentic-ui`. The numeric prefixes match presentation chapters; chapter 01 is Agentic Coding.

## Backend-only foundation

- Strict Angular production build passed.
- ESLint, Sheriff layer checks, and six Angular tests passed.
- The plain query form tests cover successful result handoff and reviewer rejection.
- All Angular components use inline templates and component-owned styles; reusable Sass stays in one shared partial.
- No CopilotKit or AG-UI dependencies appear in application package manifests or the resolved lockfile, and no integration appears in Angular source.

The original chapter 3 refactor is recoverable on `backup/03-angular-refactor-before-base-move`. These are local changes; no branch has been pushed.

## Deterministic SQL preflight on chapter 2

The historian workflow now has four steps: generation, deterministic statement preflight, semantic review, and deterministic validation/execution. The reviewer model is unchanged. A shared scanner enforces the same lexical statement policy before review and again at execution.

Validation: 19 scanner/workflow/tool-adapter tests and four SQLite execution-boundary tests passed. The workflow tests verify that prohibited statements skip both review and execution, valid SQL reaches both unchanged, and semantic rejection still stops execution. Angular production build and service type checks passed. Test model responses are deterministic stubs; these tests do not measure model quality.
