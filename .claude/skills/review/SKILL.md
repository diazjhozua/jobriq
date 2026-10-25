---
name: review
description: Review the Jobriq working diff before committing. Use for "review this", "review my changes", or as the pre-commit checklist.
---

# Review

Review `git diff` plus untracked files. Report findings as `path:line: severity: problem. fix.` — no praise, no scope creep. Only report issues that change behavior, correctness, security, or the project's stated conventions.

## Checklist

**Architecture**
- Any reference that points outward between `Jobriq.Domain`, `Jobriq.Application`, `Jobriq.Infrastructure`, `Jobriq.Web`.
- Use cases constructed with `HttpContext`, `IConfiguration`, or infrastructure types.
- New service not registered in the matching `DependencyInjection.cs`.

**Backend**
- `ProblemDetails.code` values changed or reused for a different meaning; codes are a client contract.
- Exception messages leaking API keys, base URLs, or user data.
- `DateTime.Now` / `DateTime.UtcNow` instead of `TimeProvider`.
- Missing nullable annotations or block-scoped namespaces (both fail the build).
- Package version added to a `.csproj` instead of `Directory.Packages.props`.

**Client**
- Hex colors or arbitrary color values instead of tokens from `src/index.css`.
- Status colors outside `StatusBadge`.
- A new field added to the strict schema but not the `stored*` schema, or vice versa.
- Direct `localStorage` access outside `lib/storage.ts`.
- Autosave introduced where the app uses explicit Save.
- Missing label/input association or removed focus ring.

**Tests**
- Behavior change without a test at the matching layer.
- Playwright pointed at port 5080, `reuseExistingServer` relaxed, or a real OpenAI call.
- Assertions weakened, skipped, or deleted to make a suite pass.

**Repo hygiene**
- Secrets, `.env`, `resumes/`, build output, or `wwwroot` staged.
- `CLAUDE.md` or `.claude/` files that should stay local (`.claude/settings.local.json`, `.claude/plans/`).
- Commit message not in conventional-commit form.
