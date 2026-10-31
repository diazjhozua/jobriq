using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Profiles.GenerateStandaloneResume;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.Profiles;

internal sealed class GenerateStandaloneResume : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("profile/resume", async (
            GenerateStandaloneResumeRequest request,
            ICommandHandler<GenerateStandaloneResumeCommand, GeneratedResumeDto> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new GenerateStandaloneResumeCommand(
                request.Profile,
                request.JobDescription);

            Result<GeneratedResumeDto> result = await handler.Handle(command, cancellationToken);

            return result.Match(
                resume => Results.Ok(resume),
                CustomResults.Problem);
        })
        .WithTags(Tags.Profiles);
    }
}
