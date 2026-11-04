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
dotnet test tests/Jobriq.Application.Tests --filter FullyQualifiedName~GenerateResumeCommandHandlerTests
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
src/Jobriq.SharedKernel    Result, Error, ErrorType, ValidationError (leaf)
src/Jobriq.Contracts       flat HTTP request/response DTOs and enums (leaf, no Jobriq references)
src/Jobriq.Domain          models only, no dependencies
src/Jobriq.Application     commands/queries, handlers, validators, mappings, abstractions; depends on Domain, Contracts, SharedKernel
src/Jobriq.Infrastructure  OpenAI service, exporters, EF Core/Postgres persistence; depends on Application
src/Jobriq.Web             ASP.NET Core minimal API host and IEndpoint classes; depends on Application, Contracts, Infrastructure, SharedKernel
client                     React + TypeScript SPA (Vite, Tailwind v4, Radix, RHF, Zod)
```

Dependency direction is inward only and enforced by `tests/Jobriq.Web.Tests/Architecture/LayerTests.cs`. `Jobriq.Contracts` and `Jobriq.SharedKernel` are leaves; Infrastructure must not reference Contracts; Web endpoints must not reference Domain.

Request flow: an `IEndpoint` class under `src/Jobriq.Web/Endpoints/<Model>/` binds a Contracts request, builds a command or query, and calls `ICommandHandler`/`IQueryHandler`. Scrutor wraps every handler with `ErrorHandlingDecorator` (maps known exceptions to `Result` failures) and `ValidationDecorator` (runs FluentValidation and returns `invalid_request`). Handlers map Contracts to Domain, call `IJobriqRepository`, `IResumeAiService`, or an exporter, and map the result back to Contracts. `ResultExtensions.Match` turns success into `Results.Ok`/`Created`/`File` and failure into `CustomResults.Problem`, preserving the existing `ProblemDetails.code` values. `GlobalExceptionHandler` remains the safety net for unmapped exceptions.

`GenerateResumeCommandHandler` enhances experience/project bullets, generates a summary only when blank, and extracts keywords only when a job description exists. `ExportResumeQueryHandler` selects an exporter and builds the `{slug}-resume-YYYYMMDD-HHMMSS` filename using `TimeProvider`. `GenerateStandaloneResumeCommandHandler` calls the decorated `GenerateResume` handler and persists the standalone resume. `ReviewProfileCommandHandler` returns suggestions without persisting them. `GenerateCoverLetterCommandHandler` generates and persists a cover letter in one call through `CoverLetterNormalizer`; `ExportCoverLetterQueryHandler` builds `{slug}-cover-letter-YYYYMMDD-HHMMSS.docx`.

AI prompts redact personal details by default. `ProfileRedactor` in `Application/PiiMasking` deep-clones the profile, replaces `Name`, `Email`, `Phone`, `Location`, `LinkedIn`, `GitHub`, and `Website` with `[redacted]`, and scrubs those values from free text; `GenerateResumeCommandHandler`, `ReviewProfileCommandHandler`, and `GenerateCoverLetterCommandHandler` call it before `IResumeAiService`, then normalize and persist the real data. `IPiiMaskingSettingsResolver` reads the per-client `pii_masking_settings` row (a missing row means enabled), `PUT /api/pii-masking` toggles it, and `GET /api/state` returns `piiMasking`. AI output is stripped of `[redacted]` before it is shown or persisted.

Prompt styles are a voice layer on top of the fixed task prompts. `PromptStyleCatalog`/`PromptStyleDefinition` in Domain hold the read-only built-in baseline; saved styles are `PromptStyle` aggregates (one active per client). `IPromptStyleResolver` (scoped, registered in `Application/DependencyInjection.cs`) loads the active style through `IJobriqRepository`, and `GenerateResumeCommandHandler` / `GenerateCoverLetterCommandHandler` pass a `PromptStyleDefinition` value into the writing methods of `IResumeAiService`. `Prompts.ComposeSystem` appends the style to the system message only, delimited, with an explicit clause that task instructions and the response JSON schema win; style text never reaches the task prompt or schema. Create/update/delete/activate are commands under `Application/PromptStyles/` exposed at `/api/prompt-styles`, and `GET /api/state` carries the current settings plus the baseline.

Resume themes are a design layer on top of the DOCX exporters. `ResumeThemeCatalog`/`ResumeThemeDefinition` in Domain hold five read-only built-ins (Classic is the default); saved themes are `ResumeTheme` aggregates with a JSONB `styles` document, and `ResumeThemeSettings` stores the active theme id per client. `IResumeThemeResolver` (scoped, registered in `Application/DependencyInjection.cs`) loads the settings through `IJobriqRepository`, and `ExportResumeQueryHandler` / `ExportCoverLetterQueryHandler` pass the resolved `ResumeThemeDefinition` into `IResumeExporter` / `ICoverLetterExporter`. Markdown export ignores the theme and stays plain text. Create/update/delete/activate are commands under `Application/ResumeThemes/` exposed at `/api/resume-themes`; `ResumeThemeStylesValidator` checks fonts against `ResumeThemeFonts` and sizes/margins against `ResumeThemeLimits`, and `GET /api/state` carries saved themes, the built-ins, and the effective active id.

The AI provider is chosen by `Ai:Provider`: `Fake` (deterministic, set by `appsettings.Testing.json`) or the default `OpenAI`. OpenAI config reads `OpenAI:ApiKey`, `OpenAI:Model`, `OpenAI:BaseUrl` with fallbacks to `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`. The `ChatClient` is cached after first use, so configuration changes require a server restart. Enhance, review, and keyword calls request JSON object mode; `JsonResponseParser` strips code fences and extracts a JSON object from surrounding prose. Parse failures log the raw response and map to `openai_invalid_response`. Failures map to `ProblemDetails` with a stable `code` extension (`missing_api_key`, `openai_unauthorized`, `openai_rate_limited`, `openai_invalid_response`, `export_failed`, ...) via `GlobalExceptionHandler`.

`Program.cs` maps unknown `/api/*` paths to 404 and everything else to `index.html` for SPA routing.

## Persistence

- `IJobriqRepository` in Application is the persistence boundary; `PostgresJobriqRepository` in Infrastructure implements it with EF Core 10, Npgsql, and snake_case naming.
- `ResumeProfile`, `GeneratedResume`, and `CoverLetter` are stored as JSONB documents so their shapes can evolve without table churn. Applications and their status live in relational columns, plus an optional `applied_date` month/year date; a cover letter is attached to its application (`cover_letter` jsonb).
- PII masking lives in `pii_masking_settings` (one row per client: `client_id` PK, `enabled` boolean default true, `updated_at`). A missing row means enabled; the setting is created lazily on the first `PUT /api/pii-masking`.
- Prompt styles live in the relational `prompt_styles` table (`client_id`, `name`, `instructions`, `is_active`, timestamps). A unique partial index on `client_id` filtered by `is_active` enforces one active style per client; activation is a single `ExecuteUpdate` that sets `is_active = (id = @target)` so the swap never trips the index. The built-in baseline is never persisted.
- Resume themes live in the relational `resume_themes` table (`id`, `client_id`, `name`, JSONB `styles`, timestamps) plus `resume_theme_settings`, one row per client with a nullable `active_theme_id`. Built-in themes are never persisted; deleting the active custom theme or leaving the setting null falls back to Classic.
- `ClientContextMiddleware` issues the `jobriq_client` cookie (`HttpOnly`, `SameSite=Lax`, one-year, `Secure` on HTTPS) and `CookieClientContext` carries the id into use cases. Treat the cookie as a bearer token: there is no authentication, so do not expose this deployment publicly without adding one.
- Migrations live in `src/Jobriq.Infrastructure/Persistence/Postgres/Migrations` and are versioned. `Database:ApplyMigrationsOnStartup` is `true` in Development and `false` elsewhere; `ConnectionStrings:Database` is required and comes from user secrets or `ConnectionStrings__Database`.
- `tests/e2e` starts its own disposable Postgres container and database; it never touches the development database.
- Legacy `localStorage` data (`jobriq.v1`) is intentionally not imported. The key is inert and can be cleared manually.

## Client

- Routes: `/profile`, `/applications`, and `/settings`; unknown paths redirect to `/profile`.
- The Settings screen edits prompt styles: the built-in baseline is read-only, saved styles can be created, edited, activated, and deleted, and the provider replaces `promptStyles` with the server snapshot after each mutation. The first saved style auto-activates.
- The Settings screen also has a Privacy section with a `PiiMaskingSetting` switch. It defaults on, saves through `setPiiMasking` in the provider, and replaces `piiMasking` with the server response or rolls back and shows the sync banner on failure.
- The same screen edits resume themes: the five built-ins are read-only, a saved theme starts from the active design and can be edited, activated, and deleted, and each mutation replaces `resumeThemes` with the server snapshot. `SettingsPage` shows the themes as a thumbnail gallery beside a full-page preview of a static sample resume; previewing is local selection, not activation. `ResumeThemeDialog` reuses the same preview. The in-app HTML resume preview is not themed.
- `providers/JobriqProvider.tsx` hydrates once from `GET /api/state` and calls granular mutation endpoints. Hydration failure blocks the workspace with a retry panel; mutation failures roll back optimistic changes and show a sync banner.
- `lib/schemas.ts` has two profiles: strict `profileSchema` for form validation and lenient `stored*` schemas for API hydration, so partially filled profiles still load. Keep this split when adding fields.
- `lib/template.ts` parses the legacy plain-text template format (`[PERSONAL]`, `[SUMMARY]`, `[EXPERIENCE]`, `[EDUCATION]`, `[SKILLS]`, `[PROJECT]`) for the Profile screen's Import template dialog. It is the only remaining consumer of that format.
- Generated resumes are stored on the application (`generatedResume`) or, for the profile page's standalone flow, on the profile row (`standaloneResume`); both reopen from there.
- Licenses & certifications and honors & awards are repeatable profile sections (`certifications`, `awards`) copied verbatim into generated resumes and rendered between education and skills in the preview, DOCX, and Markdown exports. They feed the review and cover-letter prompts through `Prompts.ProfileText`; review suggestions for them are advisory only (no replacement text).
- Generated bullets carry only `original` and `enhanced`. The AI keeps numbers the user already wrote and never inserts a metric placeholder, so the resume preview shows no quantification prompt.
- The Profile screen has a sticky section nav (`ProfileSectionNav`), entry sub-navs for experience, education, and projects (`EntryNav` fed by `useWatch` adapters), skills edited as removable tags (`SkillsField`), and one textarea per bullet (`BulletListField`). Blank bullets are dropped before save, review, or generation. Profile textareas use `Textarea`'s `autoGrow` prop, which measures `scrollHeight` and must be controlled.
- Profile dates (experience, education, projects) use `MonthYearPicker`, which stores display strings such as `Aug 2022`, `Present`, or legacy free text. Projects and awards capture an optional "Associated with" value through a creatable combobox that suggests experience companies and education schools (projects also suggest `Personal Project`); certifications and awards suggest companies, schools, and pooled issuing organizations and issuers. Typed custom text is kept, and every value is a snapshot, not a foreign key.
- Experience, education, certifications, and projects each capture an optional `skillsGained` tag list in the profile JSONB. It is never rendered in the preview, DOCX, or Markdown and never sent to AI prompts. Generated resumes keep it only on the education and certification entries (those are copied verbatim); generated experience and project entries omit it. The Skills section stays manually curated; a helper panel under it lists per-entry skills missing from the overall list and adds them on click or with "Add all missing".
- `lib/api.ts` parses `ProblemDetails.code` and downloads blobs using the `Content-Disposition` filename.

## Tests

- `dotnet test` covers Domain, Application, Infrastructure, and Web (`WebApplicationFactory<Program>`), plus layer rules.
- Application tests are grouped under `Handlers`, `Validators`, `Mapping`, `Behaviors`, `CoverLetters`, and `Resumes`; they construct handlers directly and assert `Result` values.
- Web tests include contract snapshots under `tests/Jobriq.Web.Tests/Contracts/Snapshots` and a route-inventory test. Regenerate snapshots only for an intentional contract change with `UPDATE_SNAPSHOTS=1 dotnet test tests/Jobriq.Web.Tests --filter FullyQualifiedName~ContractSnapshotTests`.
- Vitest + React Testing Library tests are colocated with the code under `client/src/**/*.test.ts(x)`; there is no `tests/client` directory.
- Playwright runs against an isolated server on port 5081 with the fake AI provider, a disposable PostgreSQL container, and `reuseExistingServer: false`. It never calls OpenAI and must not reuse a developer server on 5080 or the development database.

## Conventions

- Minimal APIs only; no controllers or MediatR. CQRS uses Jobriq's own `ICommand`/`IQuery` + handler interfaces, with Scrutor registration and decorators.
- Put HTTP request and response DTOs in `Jobriq.Contracts`; Application maps between Contracts and Domain. Expected failures return `Result<T>`; infrastructure failures may throw and are mapped by `ErrorHandlingDecorator` or `GlobalExceptionHandler`.
- Never change an existing route, JSON field name, enum casing, `ProblemDetails.code`, cookie name, or export filename without updating the contract snapshots and the client schemas.
- Persistence goes through `IJobriqRepository`; never reference EF Core or Npgsql from Domain or Application.
- `TreatWarningsAsErrors`, nullable, and file-scoped namespaces are mandatory for all .NET projects; central package versions in `Directory.Packages.props`.
- Use `TimeProvider` for timestamps so tests can substitute it.
- Do not call OpenAI from tests; use the `Testing` environment or substitute `IResumeAiService`.
- No hardcoded colors in client components; use the Tailwind tokens backed by CSS custom properties in `client/src/index.css`. Static SVG/PNG brand assets are the exception.
- Conventional commits via the `/commit` skill; `guard-commit.mjs` blocks non-conforming messages. No attribution trailers.
- `CLAUDE.md` and `.claude/{settings.json,agents,hooks,skills}` are committed. `.claude/settings.local.json`, `.claude/plans/`, and `.claude/cache/` are local only.

## Agentic workflow

- Run the `verify` skill (`/verify`) before every commit: fast tier for a narrow edit, standard tier for code changes, full tier (adds Playwright) before a release.
- The `review` skill (`/review`) is the pre-commit checklist for this repo; run it on the working diff.
- `/feature-dev` is the entry point for multi-layer features: it explores with `code-explorer`, designs with `code-architect` (plus the `frontend-design` skill for UI), builds with the slice skills, reviews with `code-reviewer` + `architecture-reviewer` + `ui-reviewer`, and finishes with `verify`.
- Sub-agents: `code-explorer` traces existing slices, `code-architect` writes blueprints, `code-reviewer` checks bugs and simplicity, `architecture-reviewer` for layer and DI checks, `feature-builder` for multi-file vertical slices, `test-runner` to diagnose failures, `ui-reviewer` for accessibility and token usage.
- `add-api-endpoint` and `add-client-feature` encode the vertical-slice patterns used by the `IEndpoint` slices and the Profile/Applications screens; `code-architect` preloads both, and `code-reviewer` preloads `review`.
- `feature-dev`, `frontend-design`, and the `code-*` agents are vendored from the Claude plugins of the same name (Apache-2.0, licenses kept beside the skills) and customized for Jobriq; the plugins are disabled in `.claude/settings.json` to avoid duplicate agents.

## Subdirectory instructions

| Path | Scope |
|---|---|
| `client/CLAUDE.md` | React state, schemas, styling tokens, client tests |
| `tests/e2e/CLAUDE.md` | Playwright isolation rules |
