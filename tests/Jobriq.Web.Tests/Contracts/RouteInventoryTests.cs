using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;

namespace Jobriq.Web.Tests.Contracts;

public sealed class RouteInventoryTests
{
    private static readonly string[] ExpectedRoutes =
    [
        "DELETE /api/applications/{id:guid}",
        "GET /api/state",
        "PATCH /api/applications/{id:guid}/status",
        "POST /api/applications",
        "POST /api/applications/{id:guid}/cover-letter",
        "POST /api/cover-letter/export",
        "POST /api/profile/resume",
        "POST /api/profile/review",
        "POST /api/resume/export",
        "POST /api/resume/generate",
        "PUT /api/applications/{id:guid}",
        "PUT /api/applications/{id:guid}/generated-resume",
        "PUT /api/profile"
    ];

    [Fact]
    public void ApiRoutes_AreExactlyTheClientContract()
    {
        using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        List<string> routes = factory.Services
            .GetServices<EndpointDataSource>()
            .SelectMany(source => source.Endpoints)
            .OfType<RouteEndpoint>()
            .Select(Describe)
            .Where(route => route.Contains("/api/", StringComparison.Ordinal))
            .OrderBy(route => route, StringComparer.Ordinal)
            .ToList();

        routes.ShouldBe(ExpectedRoutes);
    }

    private static string Describe(RouteEndpoint endpoint)
    {
        string method = endpoint.Metadata
            .GetMetadata<HttpMethodMetadata>()?
            .HttpMethods
            .FirstOrDefault() ?? "*";

        string pattern = endpoint.RoutePattern.RawText?.Trim('/') ?? string.Empty;

        return $"{method} /{pattern}";
    }
}
