using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.State.GetState;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.State;

internal sealed class Get : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("state", async (
            IQueryHandler<GetStateQuery, StateDto> handler,
            CancellationToken cancellationToken) =>
        {
            Result<StateDto> result = await handler.Handle(new GetStateQuery(), cancellationToken);

            return result.Match(
                state => Results.Ok(state),
                CustomResults.Problem);
        })
        .WithTags(Tags.State);
    }
}
