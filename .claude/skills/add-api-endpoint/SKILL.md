---
name: add-api-endpoint
description: Add a new backend feature or API endpoint to Jobriq following the Clean Architecture vertical slice. Use when the task needs a new domain type, command/query handler, infrastructure service, or HTTP route.
---

# Add an API endpoint

Follow an existing slice such as `Endpoints/Applications/Create.cs` -> `CreateApplicationCommand` + handler + validator -> `IJobriqRepository`. Dependencies point inward only; `tests/Jobriq.Web.Tests/Architecture/LayerTests.cs` fails otherwise.

## Steps

1. **Contracts** — add flat request/response DTOs and enums under `src/Jobriq.Contracts/`. The project is a leaf: no `Jobriq.*` references. Use `[JsonPropertyName("linkedin")]` / `[JsonPropertyName("github")]` on personal-info DTOs and keep the wire shape identical to the client schema.
2. **Domain** — add the model and its invariants under `src/Jobriq.Domain/<Area>/`. No dependencies on other Jobriq projects.
3. **Application** — add the command or query, handler, validator, and mapping under `src/Jobriq.Application/<Area>/<Action>/`.
   - Commands implement `ICommand` or `ICommand<TResponse>`; queries implement `IQuery<TResponse>`.
   - Handlers implement `ICommandHandler<...>` / `IQueryHandler<...>`, inject abstractions and `TimeProvider`, and return `Result` / `Result<T>`.
   - Expected failures use `ErrorCatalog` (`invalid_request`, `application_not_found`, ...). Do not invent new `code` values without updating the client contract.
   - Validators use FluentValidation and reproduce the existing endpoint messages and rule order.
   - Map Contracts <-> Domain with `Jobriq.Application.Common.Mapping`; never pass Domain types to Web.
4. **Register** — handlers and validators are discovered by Scrutor in `src/Jobriq.Application/DependencyInjection.cs`. No manual registration is needed unless the feature adds a new abstraction.
5. **Infrastructure** — implement the abstraction under `src/Jobriq.Infrastructure/<Area>/` and register it in `src/Jobriq.Infrastructure/DependencyInjection.cs`. Configuration keys go through `IConfiguration` with `OPENAI_*`-style fallbacks where applicable.
6. **Endpoint** — add a sealed `IEndpoint` class under `src/Jobriq.Web/Endpoints/<Model>/`. Bind a Contracts request, build the command/query, call the handler interface, and return `result.Match(..., CustomResults.Problem)`. Use `Results.Created` for creates and `Results.File` for downloads.
7. **Errors** — known exceptions map through `ExceptionErrorMapper`; add a case there for a new exception type. `GlobalExceptionHandler` remains the safety net for unknown exceptions. Never leak configuration details in messages.
8. **Tests** —
   - `tests/Jobriq.Application.Tests/Handlers` with substituted abstractions and `TestTimeProvider`.
   - `tests/Jobriq.Application.Tests/Validators` for each new validator, asserting exact messages.
   - `tests/Jobriq.Application.Tests/Mapping` when the DTO graph changes.
   - `tests/Jobriq.Web.Tests` through `WebApplicationFactory<Program>` using the `Testing` environment.
   - Add or update a contract snapshot only when the HTTP contract intentionally changes; otherwise the snapshot must stay identical.
   - Infrastructure tests only when there is real logic (parsers, exporters, repository queries); repository tests use `PostgresFixture` and Testcontainers.
9. **Client** — add the call to `client/src/lib/api.ts` if the SPA consumes it, including `ProblemDetails.code` parsing and both strict and `stored*` schemas.
10. Run the `verify` skill at the standard tier.

## Rules

- Minimal APIs only. No controllers, no MediatR.
- `Jobriq.Contracts` and `Jobriq.SharedKernel` are leaves. Infrastructure must not reference Contracts. Web endpoints must not reference Domain.
- Persistence goes through `IJobriqRepository`; Domain and Application never reference EF Core, Npgsql, or SQL types. Data is scoped by `IClientContext`.
- Expected failures return `Result<T>`; infrastructure failures may throw and are mapped by `ErrorHandlingDecorator` or `GlobalExceptionHandler`.
- Never change an existing route, JSON field name, enum casing, `ProblemDetails.code`, cookie name, or export filename without updating the contract snapshots and the client schemas.
- `TreatWarningsAsErrors` is on: nullable annotations and file-scoped namespaces are mandatory.
- Package versions go in `Directory.Packages.props`, never in a `.csproj`.
