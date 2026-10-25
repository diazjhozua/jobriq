# Playwright instructions

Repository-wide guidance lives in the root `CLAUDE.md`.

- The suite runs against its own host on port 5081 with `ASPNETCORE_ENVIRONMENT=Testing`, which selects `FakeResumeAiService`. It never calls OpenAI.
- `reuseExistingServer: false` is deliberate. Never point the suite at the developer server on 5080 or relax this flag.
- `webServer.command` rebuilds the client before starting the host; a stale `wwwroot` is not a valid excuse for a failing test.
- Run with `npm --prefix tests/e2e test` or `npm run test:e2e` from the repository root.
- Assert user-visible behavior and the download filename pattern (`{slug}-resume-YYYYMMDD-HHMMSS`). Do not assert on AI text beyond the deterministic fake output.
