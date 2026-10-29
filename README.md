<p align="center">
  <img width="200" height="200" src="assets/logo.svg" alt="Jobriq logo">
</p>

<h3 align="center">Jobriq</h3>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![GitHub Issues](https://img.shields.io/github/issues/diazjhozua/jobriq.svg)](https://github.com/diazjhozua/jobriq/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/diazjhozua/jobriq.svg)](https://github.com/diazjhozua/jobriq/pulls)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

---

<p align="center"> Build a resume profile once, tailor a resume to every application, and track the pipeline.
    <br> 
</p>

## 📝 Table of Contents

- [About](#about)
- [Getting Started](#getting_started)
- [Running the tests](#tests)
- [Usage](#usage)
- [Deployment](#deployment)
- [Built Using](#built_using)
- [Authors](#authors)
- [Acknowledgements](#acknowledgement)

## 🧐 About <a name = "about"></a>

Jobriq is a web app for people who apply to many roles and want a resume that matches each one. You keep a single profile with your personal details, summary, experience, education, skills, and projects. For every application you add, Jobriq enhances your bullets, writes a summary when you leave it blank, and highlights the ATS keywords the job description asks for. You can also generate a standalone resume from the profile page when you are not applying through Jobriq, and export either result as Markdown or DOCX.

The app is a React single-page client served by an ASP.NET Core host, with PostgreSQL persistence behind a repository boundary. Each browser gets an anonymous workspace scoped by a `jobriq_client` cookie, so there is no sign-up or login. The backend follows a Clean Architecture split (Domain, Application, Infrastructure, Web), and the AI provider can be swapped for a deterministic fake during tests.

## 🏁 Getting Started <a name = "getting_started"></a>

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See [deployment](#deployment) for notes on how to deploy the project on a live system.

### Prerequisites

```
.NET SDK 10
Node.js 20.19+ (Vite 8)
Docker, or an existing PostgreSQL 18 instance
An OpenAI-compatible API key (optional with the Fake provider)
```

### Installing

Create a `.env` file with the database password, then start PostgreSQL:

```bash
cp env.example .env
# edit .env and set POSTGRES_PASSWORD
docker compose up -d postgres
```

Point the host at the database and add your OpenAI key through user secrets:

```bash
dotnet user-secrets set "ConnectionStrings:Database" \
  "Host=localhost;Port=5432;Database=jobriq;Username=jobriq;Password=<database-password>" \
  --project src/Jobriq.Web
dotnet user-secrets set "OpenAI:ApiKey" "<key>" --project src/Jobriq.Web
```

Install the client dependencies and start the app:

```bash
npm --prefix client install
npm run start
```

Open `http://localhost:5080`. `npm run start` builds the React client into the host's `wwwroot` and starts the server. In Development, EF Core migrations apply at startup. The first request sets the `jobriq_client` cookie, and clearing cookies starts a new empty workspace.

For client-only development, run the host and Vite in separate terminals. Vite proxies `/api` to port 5080:

```bash
dotnet run --project src/Jobriq.Web
npm run dev
```

### Configuration

| Setting | Description |
|---|---|
| `OpenAI:ApiKey` | API key; `OpenAI__ApiKey` or `OPENAI_API_KEY` also works |
| `OpenAI:Model` | Model name (default: `gpt-4o`); `OPENAI_MODEL` also works |
| `OpenAI:BaseUrl` | Optional OpenAI-compatible endpoint; `OPENAI_BASE_URL` also works |
| `Ai:Provider` | `OpenAI` (default) or `Fake` for deterministic runs and tests |
| `ConnectionStrings:Database` | PostgreSQL connection string; `ConnectionStrings__Database` also works |
| `Database:ApplyMigrationsOnStartup` | Apply EF Core migrations at startup (default: `true` in Development, otherwise `false`) |

The `Testing` environment uses the fake AI provider:

```bash
ASPNETCORE_ENVIRONMENT=Testing dotnet run --project src/Jobriq.Web --no-launch-profile
```

## 🔧 Running the tests <a name = "tests"></a>

The repository has three test layers: xUnit for the .NET projects, Vitest with React Testing Library for the client, and Playwright for end-to-end flows.

```bash
npm test                    # dotnet test + Vitest
dotnet test Jobriq.sln      # Domain, Application, Infrastructure, Web, layer rules
npm --prefix client test    # Vitest, tests colocated with the source
```

### End-to-end tests

```bash
npm run test:e2e
```

Playwright starts a disposable `postgres:18-alpine` container and a unique database, runs the host on port 5081 with the fake AI service, and removes the container afterward. It never calls OpenAI, never touches the development database, and never reuses a developer server on port 5080.

### Coding style checks

```bash
npm --prefix client run typecheck   # tsc -b
npm --prefix client run lint        # oxlint
```

## 🎈 Usage <a name="usage"></a>

1. Open **Profile** and fill in your details, or choose **Import template** and paste the contents of a plain-text resume.
2. Save the profile. Saving is explicit; there is no autosave.
3. Optional: run **Review profile** for job-agnostic feedback and apply the suggestions you agree with.
4. Open **Applications** and add a role with its job description.
5. Select **Generate resume** to enhance bullets, generate a summary when blank, and match ATS keywords. Download the result as DOCX or Markdown.
6. To build a resume without an application, choose **Resume** in the profile header. The job description is optional; leave it blank to reuse your saved summary without keyword matching. The generated resume stays on the profile.

Generated resumes are stored in PostgreSQL, so they reopen after a reload. Legacy `localStorage` data under `jobriq.v1` is intentionally ignored; clear the key manually in DevTools once.

### Template format

**Import template** accepts the plain-text section format the original CLI used. Lines starting with `#` are ignored.

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

## 🚀 Deployment <a name = "deployment"></a>

Build the client and publish the host:

```bash
npm run build
dotnet publish src/Jobriq.Web -c Release -o publish
```

Configure the published app through environment variables or user secrets:

```bash
ConnectionStrings__Database="Host=<host>;Database=jobriq;Username=<user>;Password=<password>"
OpenAI__ApiKey="<key>"
OpenAI__Model="gpt-4o"
Database__ApplyMigrationsOnStartup="true"   # or run migrations during deployment
```

Run migrations before the first start, or set `Database:ApplyMigrationsOnStartup` to `true`:

```bash
dotnet ef database update --project src/Jobriq.Infrastructure --startup-project src/Jobriq.Web
```

Serve the app over HTTPS so the `jobriq_client` cookie is marked `Secure`, and put it behind a reverse proxy.

> **Warning:** There is no authentication. The `jobriq_client` cookie is effectively a bearer token for a workspace, so anyone who has it can read and change that workspace. Do not expose this deployment publicly without adding authentication.

## ⛏️ Built Using <a name = "built_using"></a>

- [.NET 10](https://dotnet.microsoft.com/) - ASP.NET Core minimal APIs
- [PostgreSQL](https://www.postgresql.org/) - Database
- [EF Core](https://learn.microsoft.com/ef/core/) + [Npgsql](https://www.npgsql.org/) - Persistence
- [OpenAI .NET SDK](https://github.com/openai/openai-dotnet) - Resume enhancement and review
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/) - Client
- [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) - Styling and primitives
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) - Forms and validation
- [xUnit](https://xunit.net/), [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/) - Tests
- [DocumentFormat.OpenXml](https://github.com/dotnet/Open-XML-SDK) - DOCX export

## ✍️ Authors <a name = "authors"></a>

- [@diazjhozua](https://github.com/diazjhozua) - Idea & Initial work

See also the list of [contributors](https://github.com/diazjhozua/jobriq/contributors) who participated in this project.

## 🎉 Acknowledgements <a name = "acknowledgement"></a>

- The AI resume workflow is inspired by [I've Reviewed 1,000+ Resumes — Here's How to Use AI to Land More Interviews](https://www.youtube.com/watch?v=KprWxa9WtIk) by [Neeraj Mathrani](https://www.youtube.com/@neerajmathrani). His framework shaped how Jobriq turns tasks into accomplishments, quantifies results, and matches ATS keywords.
- The README structure follows [The Documentation Compendium](https://github.com/kylelobo/The-Documentation-Compendium) by [@kylelobo](https://github.com/kylelobo).
- Thanks to the maintainers of OpenAI .NET, Radix UI, Tailwind CSS, and the other open-source projects this app depends on.

---

## License

MIT
