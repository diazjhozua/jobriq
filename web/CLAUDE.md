# Backend instructions

Run commands from `web/`. Repository-wide guidance lives in the root `CLAUDE.md`.

## Layers

```
src/Jobriq.Domain          models and invariants, no dependencies
src/Jobriq.Application     use cases + abstractions, depends on Domain
src/Jobriq.Infrastructure  OpenAI service, DOCX/Markdown exporters, depends on Application
src/Jobriq.Web             minimal API host, depends on Infrastructure
```

Dependencies point inward only. `tests/Jobriq.Web.Tests/Architecture/LayerTests.cs` fails the build's test run on a violation, so never add a reference that points outward to fix a compile error.

## Vertical slice recipe

1. Domain type in `src/Jobriq.Domain/<Area>/`.
2. Use case in `src/Jobriq.Application/<Area>/<Name>/` with a constructor-injected abstraction; register it in `src/Jobriq.Application/DependencyInjection.cs`.
3. Implementation in `src/Jobriq.Infrastructure/<Area>/`; register it in `src/Jobriq.Infrastructure/DependencyInjection.cs`.
4. Endpoint in `src/Jobriq.Web/Endpoints/`; keep request DTOs nested and `sealed`.
5. Map failures in `src/Jobriq.Web/Infrastructure/GlobalExceptionHandler.cs` with a stable `code` extension.
6. Tests in the matching `tests/Jobriq.*.Tests` project.

`ResumeEndpoints` + `GenerateResumeUseCase` is the reference implementation.

## Conventions

- Minimal APIs only; no controllers, MediatR, or persistence abstractions. The server is stateless.
- File-scoped namespaces are a warning promoted to an error; `TreatWarningsAsErrors` is on.
- Package versions go in `Directory.Packages.props`, never in a `.csproj`.
- `TimeProvider` for timestamps so tests can substitute it.
- AI provider selection is `Ai:Provider` (`OpenAI` default, `Fake` in `appsettings.Testing.json`). The `ChatClient` is cached after first use: restart the host after changing OpenAI settings.
- Do not call OpenAI from tests; use the `Testing` environment or substitute `IResumeAiService`.

## Commands

```bash
dotnet build Jobriq.sln
dotnet test Jobriq.sln
dotnet test tests/Jobriq.Application.Tests --filter FullyQualifiedName~GenerateResumeUseCaseTests
dotnet run --project src/Jobriq.Web
ASPNETCORE_ENVIRONMENT=Testing dotnet run --project src/Jobriq.Web --no-launch-profile
```
