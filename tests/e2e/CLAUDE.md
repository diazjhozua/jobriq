# Playwright instructions

Repository-wide guidance lives in the root `CLAUDE.md`.

- The suite runs against its own host on port 5081 with `ASPNETCORE_ENVIRONMENT=Testing`, which selects `FakeResumeAiService`. It never calls OpenAI.
- `reuseExistingServer: false` is deliberate. Never point the suite at the developer server on 5080 or relax this flag.
- `start-server.mjs` starts a disposable `postgres:18-alpine` container named `jobriq-e2e-postgres` on a random loopback port with trust auth, creates a unique `jobriq_e2e_<timestamp>` database through `Database__ApplyMigrationsOnStartup=true`, rebuilds the client, and then starts the host. `global-teardown.ts` removes the container. Docker must be running.
- Do not reuse the developer database from `docker compose`; the suite must stay isolated from `jobriq`.
- Each test gets a fresh browser context and therefore a fresh `jobriq_client` cookie, so workspaces do not leak between tests. No database reset between tests is required.
- The clean-cutover test seeds `jobriq.v1` with `page.addInitScript` and asserts the server workspace starts empty.
- Run with `npm --prefix tests/e2e test` or `npm run test:e2e` from the repository root.
- Assert user-visible behavior and the download filename patterns (`{slug}-resume-YYYYMMDD-HHMMSS` and `{slug}-cover-letter-YYYYMMDD-HHMMSS`). Do not assert on AI text beyond the deterministic fake output.
