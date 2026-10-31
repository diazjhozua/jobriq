using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Applications.UpdateDetails;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.Applications;

internal sealed class UpdateDetails : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("applications/{id:guid}", async (
            Guid id,
            UpdateApplicationDetailsRequest request,
            ICommandHandler<UpdateApplicationDetailsCommand, ApplicationDto> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateApplicationDetailsCommand(
                id,
                request.Company,
                request.Role,
                request.AppliedDate);

            Result<ApplicationDto> result = await handler.Handle(command, cancellationToken);

            return result.Match(
                application => Results.Ok(new ApplicationResponse { Application = application }),
                CustomResults.Problem);
        })
        .WithTags(Tags.Applications);
    }
}
