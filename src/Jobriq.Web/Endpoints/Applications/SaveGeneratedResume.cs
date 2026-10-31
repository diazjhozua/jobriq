using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Applications.SaveGeneratedResume;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.Applications;

internal sealed class SaveGeneratedResume : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("applications/{id:guid}/generated-resume", async (
            Guid id,
            SaveGeneratedResumeRequest request,
            ICommandHandler<SaveGeneratedResumeCommand, ApplicationDto> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new SaveGeneratedResumeCommand(id, request.Resume);

            Result<ApplicationDto> result = await handler.Handle(command, cancellationToken);

            return result.Match(
                application => Results.Ok(new ApplicationResponse { Application = application }),
                CustomResults.Problem);
        })
        .WithTags(Tags.Applications);
    }
}
