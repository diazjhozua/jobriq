using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Applications.Create;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.Applications;

internal sealed class Create : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("applications", async (
            CreateApplicationRequest request,
            ICommandHandler<CreateApplicationCommand, ApplicationDto> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateApplicationCommand(
                request.Company,
                request.Role,
                request.JobDescription,
                request.Status,
                request.AppliedDate);

            Result<ApplicationDto> result = await handler.Handle(command, cancellationToken);

            return result.Match(
                application => Results.Created(
                    $"/api/applications/{application.Id}",
                    new ApplicationResponse { Application = application }),
                CustomResults.Problem);
        })
        .WithTags(Tags.Applications);
    }
}
