using Jobriq.Application.State.GetState;
using Jobriq.Domain.State;

namespace Jobriq.Web.Endpoints;

internal static class StateEndpoints
{
    public static IEndpointRouteBuilder MapStateEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/state", GetStateAsync);

        return endpoints;
    }

    private static async Task<IResult> GetStateAsync(
        GetStateUseCase useCase,
        CancellationToken cancellationToken)
    {
        JobriqState state = await useCase.ExecuteAsync(cancellationToken);

        return Results.Ok(state);
    }
}
