# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Jobriq is a web app for building a resume profile, tracking job applications, and generating a tailored resume per application with OpenAI. The .NET host serves the React SPA and exposes the resume endpoints plus cookie-scoped workspace endpoints. Profile and applications persist per browser in PostgreSQL; each browser is identified by an anonymous `jobriq_client` cookie.

## Commands

Run from the repository root unless noted.

```bash
npm run start          # build client into wwwroot, run host on http://localhost:5080
npm run dev            # Vite dev server with /api proxy to 5080
npm run build          # build client only
npm run test           # dotnet test Jobriq.sln + client Vitest
npm run test:e2e       # Playwright (disposable Postgres, builds client, runs host on 5081 with fake AI)

dotnet build Jobriq.sln
dotnet test Jobriq.sln
dotnet test tests/Jobriq.Application.Tests --filter FullyQualifiedName~GenerateResumeUseCaseTests
dotnet run --project src/Jobriq.Web
ASPNETCORE_ENVIRONMENT=Testing dotnet run --project src/Jobriq.Web --no-launch-profile

docker compose up -d postgres                      # requires POSTGRES_PASSWORD in the environment or .env
docker compose down
dotnet ef migrations add <Name> --project src/Jobriq.Infrastructure --startup-project src/Jobriq.Web
dotnet ef database update --project src/Jobriq.Infrastructure --startup-project src/Jobriq.Web

npm --prefix client run lint                           # oxlint (no ESLint or Prettier)
npm --prefix client run typecheck
npm --prefix client test -- src/lib/schemas.test.ts   # single Vitest file
```

`npm run start` must rebuild the client; the host serves static files from `src/Jobriq.Web/wwwroot`, which Vite writes to directly. It also needs `ConnectionStrings:Database` and a running PostgreSQL instance; `docker compose up -d postgres` plus a user secret is the local setup.

## Architecture

```
src/Jobriq.Domain          models only, no dependencies
src/Jobriq.Application     use cases + abstractions, depends on Domain
src/Jobriq.Infrastructure  OpenAI service, exporters, EF Core/Postgres persistence, depends on Application
src/Jobriq.Web             ASP.NET Core minimal API host, depends on Infrastructure
client                     React + TypeScript SPA (Vite, Tailwind v4, Radix, RHF, Zod)
```

Dependency direction is inward only and enforced by `tests/Jobriq.Web.Tests/Architecture/LayerTests.cs`.

Request flow: `ResumeEndpoints` -> `GenerateResumeUseCase` (enhance experience/project bullets, generate summary only when blank, extract keywords only when a job description exists) -> `IResumeAiService` / `IResumeExporter` implementations. `ExportResumeUseCase` selects an exporter and builds the `{slug}-resume-YYYYMMDD-HHMMSS` filename using `TimeProvider`. `ProfileEndpoints` maps profile save, `/api/profile/review` (`ReviewProfileUseCase`; suggestions are returned, never persisted), and `/api/profile/resume` (`GenerateStandaloneResumeUseCase`). `ApplicationEndpoints` and `StateEndpoints` cover application CRUD, status, editable details (`PUT /api/applications/{id}` for company, role, and applied date), and workspace hydration. `ApplicationEndpoints` also maps `POST /api/applications/{id}/cover-letter`, which generates and persists a cover letter in one call (`GenerateCoverLetterUseCase` -> `CoverLetterNormalizer`); `CoverLetterEndpoints` maps `POST /api/cover-letter/export` (`ExportCoverLetterUseCase`, `{slug}-cover-letter-YYYYMMDD-HHMMSS.docx`).

The AI provider is chosen by `Ai:Provider`: `Fake` (deterministic, set by `appsettings.Testing.json`) or the default `OpenAI`. OpenAI config reads `OpenAI:ApiKey`, `OpenAI:Model`, `OpenAI:BaseUrl` with fallbacks to `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`. The `ChatClient` is cached after first use, so configuration changes require a server restart. Enhance, review, and keyword calls request JSON object mode; `JsonResponseParser` strips code fences and extracts a JSON object from surrounding prose. Parse failures log the raw response and map to `openai_invalid_response`. Failures map to `ProblemDetails` with a stable `code` extension (`missing_api_key`, `openai_unauthorized`, `openai_rate_limited`, `openai_invalid_response`, `export_failed`, ...) via `GlobalExceptionHandler`.

`Program.cs` maps unknown `/api/*` paths to 404 and everything else to `index.html` for SPA routing.

## Persistence

- `IJobriqRepository` in Application is the persistence boundary; `PostgresJobriqRepository` in Infrastructure implements it with EF Core 10, Npgsql, and snake_case naming.
- `ResumeProfile`, `GeneratedResume`, and `CoverLetter` are stored as JSONB documents so their shapes can evolve without table churn. Applications and their status live in relational columns, plus an optional `applied_date` month/year date; a cover letter is attached to its application (`cover_letter` jsonb).
- `ClientContextMiddleware` issues the `jobriq_client` cookie (`HttpOnly`, `SameSite=Lax`, one-year, `Secure` on HTTPS) and `CookieClientContext` carries the id into use cases. Treat the cookie as a bearer token: there is no authentication, so do not expose this deployment publicly without adding one.
- Migrations live in `src/Jobriq.Infrastructure/Persistence/Postgres/Migrations` and are versioned. `Database:ApplyMigrationsOnStartup` is `true` in Development and `false` elsewhere; `ConnectionStrings:Database` is required and comes from user secrets or `ConnectionStrings__Database`.
- `tests/e2e` starts its own disposable Postgres container and database; it never touches the development database.
- Legacy `localStorage` data (`jobriq.v1`) is intentionally not imported. The key is inert and can be cleared manually.

## Client

- Routes: `/profile` and `/applications`; unknown paths redirect to `/profile`.
- `providers/JobriqProvider.tsx` hydrates once from `GET /api/state` and calls granular mutation endpoints. Hydration failure blocks the workspace with a retry panel; mutation failures roll back optimistic changes and show a sync banner.
- `lib/schemas.ts` has two profiles: strict `profileSchema` for form validation and lenient `stored*` schemas for API hydration, so partially filled profiles still load. Keep this split when adding fields.
- `lib/template.ts` parses the legacy plain-text template format (`[PERSONAL]`, `[SUMMARY]`, `[EXPERIENCE]`, `[EDUCATION]`, `[SKILLS]`, `[PROJECT]`) for the Profile screen's Import template dialog. It is the only remaining consumer of that format.
- Generated resumes are stored on the application (`generatedResume`) or, for the profile page's standalone flow, on the profile row (`standaloneResume`); both reopen from there.
- Generated bullets carry only `original` and `enhanced`. The AI keeps numbers the user already wrote and never inserts a metric placeholder, so the resume preview shows no quantification prompt.
- The Profile screen has a sticky section nav (`ProfileSectionNav`), entry sub-navs for experience, education, and projects (`EntryNav` fed by `useWatch` adapters), skills edited as removable tags (`SkillsField`), and one textarea per bullet (`BulletListField`). Blank bullets are dropped before save, review, or generation. Profile textareas use `Textarea`'s `autoGrow` prop, which measures `scrollHeight` and must be controlled.
- Profile dates (experience, education, projects) use `MonthYearPicker`, which stores display strings such as `Aug 2022`, `Present`, or legacy free text. Projects also capture an optional associated company chosen from the experience company list plus `Personal Project`; the value is a snapshot, not a foreign key.
- `lib/api.ts` parses `ProblemDetails.code` and downloads blobs using the `Content-Disposition` filename.

## Tests

- `dotnet test` covers Domain, Application, Infrastructure, and Web (`WebApplicationFactory<Program>`), plus layer rules.
- Vitest + React Testing Library tests are colocated with the code under `client/src/**/*.test.ts(x)`; there is no `tests/client` directory.
- Playwright runs against an isolated server on port 5081 with the fake AI provider, a disposable PostgreSQL container, and `reuseExistingServer: false`. It never calls OpenAI and must not reuse a developer server on 5080 or the development database.

## Conventions

- Minimal APIs only; no controllers or MediatR. Persistence goes through `IJobriqRepository`; never reference EF Core or Npgsql from Domain or Application.
- `TreatWarningsAsErrors`, nullable, and file-scoped namespaces are mandatory for all .NET projects; central package versions in `Directory.Packages.props`.
- Use `TimeProvider` for timestamps so tests can substitute it.
- Do not call OpenAI from tests; use the `Testing` environment or substitute `IResumeAiService`.
- No hardcoded colors in client components; use the Tailwind tokens backed by CSS custom properties in `client/src/index.css`. Static SVG/PNG brand assets are the exception.
- Conventional commits via the `/commit` skill; `guard-commit.mjs` blocks non-conforming messages. No attribution trailers.
- `CLAUDE.md` and `.claude/{settings.json,agents,hooks,skills}` are committed. `.claude/settings.local.json`, `.claude/plans/`, and `.claude/cache/` are local only.

## Agentic workflow

- Run the `verify` skill (`/verify`) before every commit: fast tier for a narrow edit, standard tier for code changes, full tier (adds Playwright) before a release.
- The `review` skill (`/review`) is the pre-commit checklist for this repo; run it on the working diff.
- Sub-agents: `architecture-reviewer` for layer and DI checks, `feature-builder` for multi-file vertical slices, `test-runner` to diagnose failures, `ui-reviewer` for accessibility and token usage.
- `add-api-endpoint` and `add-client-feature` encode the vertical-slice patterns used by `ResumeEndpoints` and the Profile/Applications screens.

## Subdirectory instructions

| Path | Scope |
|---|---|
| `client/CLAUDE.md` | React state, schemas, styling tokens, client tests |
| `tests/e2e/CLAUDE.md` | Playwright isolation rules |
