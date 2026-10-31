using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Resumes.Generate;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.Resumes;

internal sealed class Generate : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("resume/generate", async (
            GenerateResumeRequest request,
            ICommandHandler<GenerateResumeCommand, GeneratedResumeDto> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new GenerateResumeCommand(request.Profile, request.JobDescription);

            Result<GeneratedResumeDto> result = await handler.Handle(command, cancellationToken);

            return result.Match(
                resume => Results.Ok(resume),
                CustomResults.Problem);
        })
        .WithTags(Tags.Resumes);
    }
}
