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
- **Local-first** — profile and applications live in the browser under `jobriq.v1`; the server keeps no state

---

## Prerequisites

- .NET SDK 10
- Node.js 20+
- An OpenAI-compatible API key

---

## Setup

```bash
cd web
dotnet user-secrets set "OpenAI:ApiKey" "<key>" --project src/Jobriq.Web
npm --prefix client install
npm run start
```

Open `http://localhost:5080`. `npm run start` builds the React client into the .NET host's `wwwroot` and starts the server.

For client-only development, run `dotnet run --project src/Jobriq.Web` from `web/` and `npm run dev` from `web/client` in separate terminals. Vite proxies `/api` to port 5080.

### Configuration

| Setting | Description |
|---|---|
| `OpenAI:ApiKey` | API key; `OpenAI__ApiKey` or `OPENAI_API_KEY` also works |
| `OpenAI:Model` | Model name (default: `gpt-4o`); `OPENAI_MODEL` also works |
| `OpenAI:BaseUrl` | Optional OpenAI-compatible endpoint; `OPENAI_BASE_URL` also works |
| `Ai:Provider` | `OpenAI` (default) or `Fake` for deterministic local runs and tests |

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
dotnet test web/Jobriq.sln
npm --prefix web/client test
npm --prefix web/tests/e2e test
```

Playwright runs against a server configured with the fake AI service; it never calls OpenAI.

---

## Architecture

```
web/
  Jobriq.sln
  src/
    Jobriq.Domain/          domain models
    Jobriq.Application/     use cases and abstractions
    Jobriq.Infrastructure/  OpenAI service, DOCX and Markdown exporters
    Jobriq.Web/             ASP.NET Core host and API
  client/                   React + TypeScript SPA
  tests/
    Jobriq.*.Tests/         xUnit test projects
    client/                 Vitest + React Testing Library
    e2e/                    Playwright
```

Dependencies point inward: Domain has no dependencies, Application depends on Domain, Infrastructure depends on Application, and Web depends on Infrastructure.

### API

| Endpoint | Purpose |
|---|---|
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

- `CLAUDE.md` at the root covers the product, commands, and architecture. `web/CLAUDE.md`, `web/client/CLAUDE.md`, and `web/tests/e2e/CLAUDE.md` add layer-specific guidance and load when you work in those directories.
- Skills in `.claude/skills/`: `verify` (test tiers), `review` (pre-commit checklist), `add-api-endpoint`, and `add-client-feature`.
- Sub-agents in `.claude/agents/`: `architecture-reviewer`, `feature-builder`, `test-runner`, and `ui-reviewer`.
- Hooks in `.claude/hooks/` block destructive git and secret staging, block writes to build output, and run typecheck, lint, and build when a turn ends with changes.
- `.mcp.json` registers Playwright, Context7, Microsoft Learn, and GitHub MCP servers. They require approval on first use.
- `.claude/settings.local.json` and `.claude/plans/` stay local and are gitignored.

Run `/verify` before committing and `/review` on the working diff.

---

## License

MIT
