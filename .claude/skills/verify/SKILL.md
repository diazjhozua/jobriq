---
name: verify
description: Run Jobriq's verification tiers before committing or when asked to check the build. Use for "verify", "run the tests", "is this green", or after finishing a code change.
---

# Verify

Run the cheapest tier that covers the change, then report exact results. Never claim green without running the command.

All commands run from the repository root.

## Fast tier (client-only or docs edits)

```bash
npm --prefix client run typecheck
npm --prefix client run lint
dotnet build Jobriq.sln
```

## Standard tier (any backend or shared change, required before commit)

```bash
dotnet test Jobriq.sln
npm --prefix client test
```

## Full tier (before a release or when touching generation/export/Playwright)

```bash
npm --prefix tests/e2e test
```

The E2E suite builds the client and starts its own host on port 5081 with the fake AI provider. It must never reuse port 5080 or call OpenAI.

## Reporting

- On failure, quote the failing command and the shortest decisive error line or failing test name.
- Do not weaken assertions, skip tests, or delete tests to go green.
- If a full `dotnet test` fails because a running `Jobriq.Web` process locks the output DLLs, stop the process and rerun; do not use `--no-build` to hide it.
- Summarize as: tier run, command list, pass/fail counts, and the first failure with its file path.
