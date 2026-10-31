using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Applications.UpdateStatus;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.Applications;

internal sealed class UpdateStatus : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPatch("applications/{id:guid}/status", async (
            Guid id,
            UpdateApplicationStatusRequest request,
            ICommandHandler<UpdateApplicationStatusCommand, ApplicationDto> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateApplicationStatusCommand(id, request.Status);

            Result<ApplicationDto> result = await handler.Handle(command, cancellationToken);

            return result.Match(
                application => Results.Ok(new ApplicationResponse { Application = application }),
                CustomResults.Problem);
        })
        .WithTags(Tags.Applications);
    }
}
