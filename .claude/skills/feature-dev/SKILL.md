---
name: feature-dev
description: Guided Jobriq feature development - explore, clarify, design, build, review, verify. Use for "/feature-dev", "build feature X", or any change spanning several layers or screens.
argument-hint: Optional feature description
---

# Feature Development

Adapted from the `feature-dev` plugin (Apache-2.0, see `LICENSE`) and wired to Jobriq's own agents and skills. Work in phases, wait for the user at each gate, and track progress with TodoWrite.

Initial request: $ARGUMENTS

## Principles

- Read the root `CLAUDE.md` first; read `client/CLAUDE.md` when the client is involved and `tests/e2e/CLAUDE.md` when Playwright is involved.
- Reuse before inventing. The vertical-slice patterns live in the `add-api-endpoint` and `add-client-feature` skills; designs and code follow them unless the user approves a deviation.
- Ask before assuming. Wait for answers at every gate marked **Gate**.
- After agents return, read the key files they list before deciding anything.

## Agents and skills used

| Phase | Use |
|---|---|
| Explore | `code-explorer` (2-3 in parallel) |
| Design | `code-architect` (2-3 in parallel); `frontend-design` skill for new or reshaped UI |
| Build | main thread with `add-api-endpoint` / `add-client-feature`; `feature-builder` for a large, approved, self-contained slice |
| Review | `code-reviewer`, `architecture-reviewer` (backend touched), `ui-reviewer` (client touched) in parallel |
| Verify | `verify` skill; `test-runner` on failures |
| Ship | `/commit` (only when the user asks) |

## Phase 1: Discovery

1. Create the todo list with all phases.
2. If the request is unclear, ask what problem it solves, what it should do, and any constraints.
3. Classify the scope: backend only, client only, or full slice (domain -> application -> infrastructure -> endpoint -> `lib/api.ts` -> `JobriqProvider` -> screen). Note whether it touches AI generation, export, persistence (JSONB document vs relational column, migration), or routing.
4. Summarize your understanding and confirm with the user.

## Phase 2: Codebase exploration

1. Launch 2-3 `code-explorer` agents in parallel, each on a different aspect, for example:
   - the closest existing slice (e.g. cover letter: `ApplicationEndpoints` -> `GenerateCoverLetterUseCase` -> `CoverLetterNormalizer` -> `CoverLetterDialog`)
   - the persistence and state path (`IJobriqRepository`, `PostgresJobriqRepository`, `/api/state`, `JobriqProvider`, `stored*` schemas)
   - UI patterns, components in `components/ui`, and test approach for the affected screen
2. Read every key file they return.
3. Present a summary of findings and the patterns the feature must follow.

## Phase 3: Clarifying questions — **Gate**

Do not skip. List concrete questions about edge cases, error handling and `ProblemDetails.code` values, persistence shape and migrations, strict vs lenient schema impact, empty/error states, AI provider behavior (including the `Fake` provider for tests), and scope boundaries. Wait for answers. If the user says "whatever you think", give a recommendation and get explicit confirmation.

## Phase 4: Architecture design — **Gate**

1. Launch 2-3 `code-architect` agents in parallel with different focuses: minimal change, clean architecture, pragmatic balance.
2. If the feature adds or reshapes UI, apply the `frontend-design` skill to the UI part of the chosen design.
3. Present each approach briefly, the trade-offs, and your recommendation with reasoning. Ask which approach to take.

## Phase 5: Implementation — **Gate**

Do not start without explicit approval.

1. Re-read the files the chosen blueprint touches.
2. Build following `add-api-endpoint` (backend) and `add-client-feature` (client). Write tests at each layer you change as you go.
3. For a large, self-contained slice the user approved, you may delegate to `feature-builder` with the blueprint; otherwise implement in the main thread.
4. Keep root and client `CLAUDE.md` accurate if the change alters something they describe.

## Phase 6: Quality review — **Gate**

1. Launch in parallel:
   - `code-reviewer` — bugs, correctness, simplicity/DRY.
   - `architecture-reviewer` — if anything under `src/` or `tests/` changed.
   - `ui-reviewer` — if anything under `client/` changed.
2. Consolidate, drop duplicates, rank by severity.
3. Present findings and ask: fix now, fix later, or proceed. Apply what the user chooses.

## Phase 7: Verify

Run the `verify` skill: standard tier for code changes, full tier when generation, export, routing, or Playwright is touched. On failure, use `test-runner`. Report exact results; never claim green without running the commands.

## Phase 8: Summary

Mark todos complete and summarize what was built, key decisions, files changed, verification results, and next steps. Offer `/commit`; do not commit unless asked.
