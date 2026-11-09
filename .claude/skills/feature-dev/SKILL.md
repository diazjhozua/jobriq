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
| Worktree | `EnterWorktree` (always, before anything else) |
| Explore | `codegraph` sync/init first, then `code-explorer` (2-3 in parallel) |
| Design | `code-architect` (2-3 in parallel); `frontend-design` skill for new or reshaped UI |
| Build | main thread with `add-api-endpoint` / `add-client-feature`; `feature-builder` for a large, approved, self-contained slice |
| Review | `code-reviewer`, `architecture-reviewer` (backend touched), `ui-reviewer` (client touched) in parallel |
| Verify | `verify` skill; `test-runner` on failures |
| Ship | `/commit` (only when the user asks) |

## Phase 0: Worktree — always first

Every run starts in its own worktree, before discovery:

1. If the session is already inside a worktree, reuse it; otherwise call `EnterWorktree` with a short name derived from the request (`feature-dev-<slug>`). `EnterWorktree` refuses to create a second worktree in the same session.
2. Run every command from the worktree directory for the rest of the run; the only exception is the Phase 8 `git apply` into the main checkout.
3. This skill never commits. Phase 8 asks the user whether to move the changes into the main checkout as uncommitted working-tree edits.

## Phase 1: Discovery

1. Create the todo list with all phases.
2. If the request is unclear, ask what problem it solves, what it should do, and any constraints.
3. Classify the scope: backend only, client only, or full slice (domain -> application -> infrastructure -> endpoint -> `lib/api.ts` -> `JobriqProvider` -> screen). Note whether it touches AI generation, export, persistence (JSONB document vs relational column, migration), or routing.
4. Summarize your understanding and confirm with the user.

## Phase 2: Codebase exploration

0. Refresh the code graph before any agent runs, from the worktree so the index reflects the branch under work. If `codegraph` is not on PATH (`command -v codegraph`), skip this step and rely on the `code-explorer` agents. Otherwise check for a worktree-local index (`test -d .codegraph`): run `codegraph init` when it is missing and `codegraph sync` when it exists, never relying on an index inherited from the main checkout. Then seed the exploration with `codegraph explore "<area>"`, `codegraph context "<task>"`, or `codegraph node <symbol>` and hand the symbol locations and call paths to the agents.
1. Launch 2-3 `code-explorer` agents in parallel, each on a different aspect, for example:
   - the closest existing slice (e.g. cover letter: `Endpoints/Applications/GenerateCoverLetter.cs` -> `GenerateCoverLetterCommandHandler` -> `CoverLetterNormalizer` -> `CoverLetterDialog`)
   - the persistence and state path (`IJobriqRepository`, `PostgresJobriqRepository`, `/api/state`, `JobriqProvider`, `stored*` schemas)
   - UI patterns, components in `components/ui`, and test approach for the affected screen
2. Read every key file they return.
3. Present a summary of findings and the patterns the feature must follow.

## Phase 3: Clarifying questions — **Gate**

Do not skip. List concrete questions about edge cases, error handling and `ProblemDetails.code` values, persistence shape and migrations, strict vs lenient schema impact, empty/error states, AI provider behavior (including the `Fake` provider for tests), and scope boundaries. Wait for answers. If the user says "whatever you think", give a recommendation and get explicit confirmation.

## Phase 4: Architecture design — **Gate**

1. Launch 2-3 `code-architect` agents in parallel, one per focus: `minimal`, `balanced`, `maximal`. All three obey the same Clean Architecture layering; that is a fixed constraint, not an option. The focus changes only how much new abstraction the design introduces.

   | Focus | Optimizes | Pick when |
   |---|---|---|
   | `minimal` | fewest new concepts; reuse the existing slice as-is | an existing slice already does most of the work |
   | `balanced` | a new abstraction only when a real second consumer or a boundary rule earns it | the feature fits the vertical-slice pattern with a few new pieces (default) |
   | `maximal` | full seams, one abstraction per concept | the feature is known to grow several consumers, or the boundary is genuinely unclear |
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
3. Present findings and ask: fix now, fix later, or proceed. Apply what the user chooses. If the user wants to stop here, jump to the Phase 8 worktree question.

## Phase 7: Verify

Run the `verify` skill: standard tier for code changes, full tier when generation, export, routing, or Playwright is touched. On failure, use `test-runner`. Report exact results; never claim green without running the commands.

## Phase 8: Summary and worktree exit — **Gate**

1. Mark todos complete and summarize what was built, key decisions, files changed, verification results, and next steps.
2. Ask the user whether to move the changes into the main checkout and exit the worktree. Do not commit anything; the changes land in main as uncommitted working-tree edits.
3. If yes:
   - In the worktree, capture tracked, staged, and untracked changes without the codegraph index: `git add -N -- . ':(exclude).codegraph'` then `git diff HEAD --binary > /tmp/feature-dev.patch` (any path outside the repository works).
   - Call `ExitWorktree` with `action: "keep"` so the worktree branch survives as a recovery point.
   - In the main checkout, run `git apply /tmp/feature-dev.patch` and report the changed files.
   - Give the user the worktree path and branch so they can delete it once satisfied.
4. If no, leave the worktree in place and tell the user its path and branch.
5. Offer `/commit`; do not commit unless asked.
