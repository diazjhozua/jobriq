---
name: add-api-endpoint
description: Add a new backend feature or API endpoint to Jobriq following the Clean Architecture vertical slice. Use when the task needs a new domain type, use case, infrastructure service, or HTTP route.
---

# Add an API endpoint

Follow the existing slice `ResumeEndpoints` + `GenerateResumeUseCase` + `IResumeAiService`. Dependencies point inward only; `web/tests/Jobriq.Web.Tests/Architecture/LayerTests.cs` fails otherwise.

## Steps

1. **Domain** — add the model and its invariants under `web/src/Jobriq.Domain/<Area>/`. No dependencies on other Jobriq projects.
2. **Application** — add the use case under `web/src/Jobriq.Application/<Area>/<UseCase>/`. Inject abstractions and `TimeProvider` through the constructor; no `HttpContext`, no `IConfiguration`, no infrastructure types. Add an abstraction under `Abstractions/` if the use case needs I/O.
3. **Register** — add the use case to `web/src/Jobriq.Application/DependencyInjection.cs`.
4. **Infrastructure** — implement the abstraction under `web/src/Jobriq.Infrastructure/<Area>/` and register it in `web/src/Jobriq.Infrastructure/DependencyInjection.cs`. Configuration keys go through `IConfiguration` with `OPENAI_*`-style fallbacks where applicable.
5. **Endpoint** — add the route in `web/src/Jobriq.Web/Endpoints/`, keep request DTOs nested and `sealed`, return `Results.Problem` with a stable `code` extension for invalid input.
6. **Errors** — map new exception types in `web/src/Jobriq.Web/Infrastructure/GlobalExceptionHandler.cs`; do not leak exception messages that contain configuration details.
7. **Tests** —
   - `web/tests/Jobriq.Application.Tests` with a substituted abstraction and `TestTimeProvider`.
   - `web/tests/Jobriq.Web.Tests` through `WebApplicationFactory<Program>` using the `Testing` environment.
   - Infrastructure tests only when there is real logic (parsers, exporters).
8. **Client** — add the call to `web/client/src/lib/api.ts` if the SPA consumes it, including `ProblemDetails.code` parsing.
9. Run the `verify` skill at the standard tier.

## Rules

- Minimal APIs only. No controllers, MediatR, repositories, or persistence.
- The server is stateless; state belongs in the client.
- `TreatWarningsAsErrors` is on: nullable annotations and file-scoped namespaces are mandatory.
- Package versions go in `web/Directory.Packages.props`, never in a `.csproj`.
