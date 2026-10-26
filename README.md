# Jobriq

AI-powered resume builder. Keep a profile, track job applications, and generate a tailored resume for each application. Export as `.docx` or Markdown.

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

---

## Features

- **Profile editor** — personal details, summary, experience, education, skills, and projects
- **Application tracker** — add applications, update status, keep the job description
- **AI resume generation** — enhanced bullets, generated summary, ATS keyword matching per application
- **Template import** — paste an existing plain-text resume template to fill the profile
- **Export to `.docx` + `.md`** — timestamped downloads
- **Per-browser workspace** — profile and applications persist in PostgreSQL, keyed by an anonymous `jobriq_client` cookie

---

## Prerequisites

- .NET SDK 10
- Node.js 20+
- Docker (for the PostgreSQL container) or PostgreSQL 18
- An OpenAI-compatible API key

---

## Setup

Create a `.env` file at the repository root with the database password (it is gitignored), then start PostgreSQL and configure the host:

```bash
echo "POSTGRES_PASSWORD=<database-password>" > .env
docker compose up -d postgres

dotnet user-secrets set "ConnectionStrings:Database" \
  "Host=localhost;Port=5432;Database=jobriq;Username=jobriq;Password=<database-password>" \
  --project src/Jobriq.Web
dotnet user-secrets set "OpenAI:ApiKey" "<key>" --project src/Jobriq.Web

npm --prefix client install
npm run start
```

Open `http://localhost:5080`. `npm run start` builds the React client into the .NET host's `wwwroot` and starts the server. In Development, EF Core migrations apply at startup.

The first request sets an anonymous `jobriq_client` cookie, and all profile and application data is scoped to it. Clearing cookies starts a new empty workspace. There is no authentication; do not expose this deployment publicly.

Legacy `localStorage` data under `jobriq.v1` is intentionally not imported. Clear the key manually in DevTools once; the app ignores it.

For client-only development, run `dotnet run --project src/Jobriq.Web` from the repository root and `npm run dev` from `client/` in separate terminals. Vite proxies `/api` to port 5080.

### Configuration

| Setting | Description |
|---|---|
| `OpenAI:ApiKey` | API key; `OpenAI__ApiKey` or `OPENAI_API_KEY` also works |
| `OpenAI:Model` | Model name (default: `gpt-4o`); `OPENAI_MODEL` also works |
| `OpenAI:BaseUrl` | Optional OpenAI-compatible endpoint; `OPENAI_BASE_URL` also works |
| `Ai:Provider` | `OpenAI` (default) or `Fake` for deterministic local runs and tests |
| `ConnectionStrings:Database` | PostgreSQL connection string; `ConnectionStrings__Database` also works |
| `Database:ApplyMigrationsOnStartup` | Apply EF Core migrations at startup (default: `true` in Development, otherwise `false`) |

The `Testing` environment sets `Ai:Provider` to `Fake`:

```bash
ASPNETCORE_ENVIRONMENT=Testing dotnet run --project src/Jobriq.Web --no-launch-profile
```

---

## Usage

1. Open **Profile** and fill in your details, or use **Import template** and paste the contents of a plain-text resume.
2. Save the profile.
3. Open **Applications** and add an application with its job description.
4. Select **Generate resume** to enhance bullets, generate a summary when blank, and match ATS keywords.
5. Download the result as DOCX or Markdown.

---

## Template Format

**Import template** accepts the same plain-text section format the original CLI used. Lines starting with `#` are ignored.

```
[PERSONAL]
Name: Alex Rivera
Email: alex@example.com

[SUMMARY]
Type: professional
Content:

[EXPERIENCE]
Company: Acme Corp
Title: Software Engineer
Start: Jan 2022
End: Present
- worked on the chat feature
- built tools for the QA team

[EDUCATION]
School: State University
Degree: BSc
Field: Computer Science
Start: 2018
End: 2022
GPA: 3.8

[SKILLS]
TypeScript, React, .NET

[PROJECT]
Name: Jobriq
URL: https://github.com/diazjhozua/jobriq
- AI resume builder
```

`[JOB DESCRIPTION]` and `[AI SUGGESTIONS]` sections are ignored on import.

---

## Tests

```bash
dotnet test Jobriq.sln
npm --prefix client test
npm --prefix tests/e2e test
```

Playwright starts a disposable `postgres:18-alpine` container and a unique database, runs the host on port 5081 with the fake AI service, and removes the container afterward. It never calls OpenAI and never touches the development database.

---

## Architecture

```
Jobriq.sln
src/
  Jobriq.Domain/          domain models
  Jobriq.Application/     use cases and abstractions
  Jobriq.Infrastructure/  OpenAI service, exporters, EF Core/Postgres persistence
  Jobriq.Web/             ASP.NET Core host and API
client/                   React + TypeScript SPA
tests/
  Jobriq.*.Tests/         xUnit test projects
  e2e/                    Playwright
```

Dependencies point inward: Domain has no dependencies, Application depends on Domain, Infrastructure depends on Application, and Web depends on Infrastructure.

### API

| Endpoint | Purpose |
|---|---|
| `GET /api/state` | Profile and applications for the `jobriq_client` cookie |
| `PUT /api/profile` | Replace the profile |
| `POST /api/applications` | Create an application |
| `PATCH /api/applications/{id}/status` | Change an application status |
| `DELETE /api/applications/{id}` | Delete an application and its generated resume |
| `PUT /api/applications/{id}/generated-resume` | Store a generated resume on an application |
| `POST /api/resume/generate` | Profile + job description in, generated resume JSON out |
| `POST /api/resume/export` | Generated resume in, DOCX or Markdown file out |

---

## Built With

- [.NET](https://dotnet.microsoft.com/) — ASP.NET Core, minimal APIs
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- [OpenAI .NET SDK](https://github.com/openai/openai-dotnet)
- [DocumentFormat.OpenXml](https://github.com/dotnet/Open-XML-SDK)

---

## Author

**Jhozua Diaz** — [@diazjhozua](https://github.com/diazjhozua)

## Acknowledgements

The AI resume enhancement workflow in Jobriq is inspired by **[I've Reviewed 1,000+ Resumes — Here's How to Use AI to Land More Interviews](https://www.youtube.com/watch?v=KprWxa9WtIk)** by [Neeraj Mathrani](https://www.youtube.com/@neerajmathrani). His 8-step framework — turning tasks into accomplishments, quantifying results, ATS keyword matching, and the objective vs. professional summary distinction — directly shaped how Jobriq's AI pipeline works.

## Agentic workflow

This repository ships its Claude Code configuration so the setup is reproducible.

- `CLAUDE.md` at the root covers the product, commands, architecture, and backend conventions. `client/CLAUDE.md` and `tests/e2e/CLAUDE.md` add layer-specific guidance and load when you work in those directories.
- Skills in `.claude/skills/`: `commit` (Conventional Commits), `verify` (test tiers), `review` (pre-commit checklist), `add-api-endpoint`, and `add-client-feature`.
- Sub-agents in `.claude/agents/`: `architecture-reviewer`, `feature-builder`, `test-runner`, and `ui-reviewer`.
- Hooks in `.claude/hooks/` block destructive git and secret staging, reject non-conforming commit messages, block writes to build output, and run typecheck, lint, and build when a turn ends with changes.
- `.mcp.json` registers Playwright, Context7, Microsoft Learn, and GitHub MCP servers. They require approval on first use.
- `.claude/settings.local.json` and `.claude/plans/` stay local and are gitignored.

Run `/verify` before committing and `/review` on the working diff.

---

## License

MIT
