# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Jobriq is a web app for building a resume profile, tracking job applications, and generating a tailored resume per application with OpenAI. The .NET host serves the React SPA and exposes two API endpoints. All user data lives in browser `localStorage` under `jobriq.v1`; the server is stateless.

## Commands

Run from `web/` unless noted.

```bash
npm run start          # build client into wwwroot, run host on http://localhost:5080
npm run dev            # Vite dev server with /api proxy to 5080
npm run build          # build client only
npm run test           # dotnet test Jobriq.sln + client Vitest
npm run test:e2e       # Playwright (builds client, runs host on 5081 with fake AI)

dotnet build Jobriq.sln
dotnet test Jobriq.sln
dotnet test tests/Jobriq.Application.Tests --filter FullyQualifiedName~GenerateResumeUseCaseTests
dotnet run --project src/Jobriq.Web
ASPNETCORE_ENVIRONMENT=Testing dotnet run --project src/Jobriq.Web --no-launch-profile

npm --prefix client run lint                           # oxlint (no ESLint or Prettier)
npm --prefix client run typecheck
npm --prefix client test -- src/lib/schemas.test.ts   # single Vitest file
```

`npm run start` must rebuild the client; the host serves static files from `src/Jobriq.Web/wwwroot`, which Vite writes to directly.

## Architecture

```
web/src/Jobriq.Domain          models only, no dependencies
web/src/Jobriq.Application     use cases + abstractions, depends on Domain
web/src/Jobriq.Infrastructure  OpenAI service, DOCX/Markdown exporters, depends on Application
web/src/Jobriq.Web             ASP.NET Core minimal API host, depends on Infrastructure
web/client                     React + TypeScript SPA (Vite, Tailwind v4, Radix, RHF, Zod)
```

Dependency direction is inward only and enforced by `tests/Jobriq.Web.Tests/Architecture/LayerTests.cs`.

Request flow: `ResumeEndpoints` -> `GenerateResumeUseCase` (enhance experience/project bullets, generate summary only when blank, extract keywords only when a job description exists) -> `IResumeAiService` / `IResumeExporter` implementations. `ExportResumeUseCase` selects an exporter and builds the `{slug}-resume-YYYYMMDD-HHMMSS` filename using `TimeProvider`.

The AI provider is chosen by `Ai:Provider`: `Fake` (deterministic, set by `appsettings.Testing.json`) or the default `OpenAI`. OpenAI config reads `OpenAI:ApiKey`, `OpenAI:Model`, `OpenAI:BaseUrl` with fallbacks to `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`. The `ChatClient` is cached after first use, so configuration changes require a server restart. Failures map to `ProblemDetails` with a stable `code` extension (`missing_api_key`, `openai_unauthorized`, `openai_rate_limited`, `export_failed`, ...) via `GlobalExceptionHandler`.

`Program.cs` maps unknown `/api/*` paths to 404 and everything else to `index.html` for SPA routing.

## Client

- Routes: `/profile` and `/applications`; unknown paths redirect to `/profile`.
- `providers/JobriqProvider.tsx` loads state once, saves the whole state on every mutation, and surfaces a non-blocking storage error when `localStorage` writes fail.
- `lib/schemas.ts` has two profiles: strict `profileSchema` for form validation and lenient `stored*` schemas for hydration, so partially filled profiles still load. Keep this split when adding fields.
- `lib/template.ts` parses the legacy plain-text template format (`[PERSONAL]`, `[SUMMARY]`, `[EXPERIENCE]`, `[EDUCATION]`, `[SKILLS]`, `[PROJECT]`) for the Profile screen's Import template dialog. It is the only remaining consumer of that format.
- Generated resumes are stored on the application (`generatedResume`) and reopened from there.
- `lib/api.ts` parses `ProblemDetails.code` and downloads blobs using the `Content-Disposition` filename.

## Tests

- `dotnet test` covers Domain, Application, Infrastructure, and Web (`WebApplicationFactory<Program>`), plus layer rules.
- Vitest + React Testing Library tests are colocated with the code under `web/client/src/**/*.test.ts(x)`; there is no `web/tests/client` directory.
- Playwright runs against an isolated server on port 5081 with the fake AI provider and `reuseExistingServer: false`. It never calls OpenAI and must not reuse a developer server on 5080.

## Conventions

- `TreatWarningsAsErrors` and nullable enabled for all .NET projects; central package versions in `Directory.Packages.props`.
- No hardcoded colors in the client; use the Tailwind tokens backed by CSS custom properties in `client/src/index.css`.
- Conventional commits, no attribution trailers.
- `CLAUDE.md` and `.claude/{settings.json,agents,hooks,skills}` are committed. `.claude/settings.local.json`, `.claude/plans/`, and `.claude/cache/` are local only.

## Agentic workflow

- Run the `verify` skill (`/verify`) before every commit: fast tier for a narrow edit, standard tier for code changes, full tier (adds Playwright) before a release.
- The `review` skill (`/review`) is the pre-commit checklist for this repo; run it on the working diff.
- Sub-agents: `architecture-reviewer` for layer and DI checks, `feature-builder` for multi-file vertical slices, `test-runner` to diagnose failures, `ui-reviewer` for accessibility and token usage.
- `add-api-endpoint` and `add-client-feature` encode the vertical-slice patterns used by `ResumeEndpoints` and the Profile/Applications screens.

## Subdirectory instructions

| Path | Scope |
|---|---|
| `web/CLAUDE.md` | .NET layers, use cases, endpoints, AI provider, backend tests |
| `web/client/CLAUDE.md` | React state, schemas, styling tokens, client tests |
| `web/tests/e2e/CLAUDE.md` | Playwright isolation rules |
