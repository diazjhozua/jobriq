using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Applications.GenerateCoverLetter;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.Applications;

internal sealed class GenerateCoverLetter : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("applications/{id:guid}/cover-letter", async (
            Guid id,
            ICommandHandler<GenerateCoverLetterCommand, ApplicationDto> handler,
            CancellationToken cancellationToken) =>
        {
            Result<ApplicationDto> result = await handler.Handle(
                new GenerateCoverLetterCommand(id),
                cancellationToken);

            return result.Match(
                application => Results.Ok(new ApplicationResponse { Application = application }),
                CustomResults.Problem);
        })
        .WithTags(Tags.Applications);
    }
}
