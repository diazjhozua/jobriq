using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Applications.Delete;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.Applications;

internal sealed class Delete : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete("applications/{id:guid}", async (
            Guid id,
            ICommandHandler<DeleteApplicationCommand> handler,
            CancellationToken cancellationToken) =>
        {
            Result result = await handler.Handle(
                new DeleteApplicationCommand(id),
                cancellationToken);

            return result.Match(
                () => Results.NoContent(),
                CustomResults.Problem);
        })
        .WithTags(Tags.Applications);
    }
}
