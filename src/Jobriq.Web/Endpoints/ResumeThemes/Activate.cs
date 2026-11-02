using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.ResumeThemes.Activate;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.ResumeThemes;

internal sealed class Activate : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("resume-themes/{id:guid}/activate", async (
            Guid id,
            ICommandHandler<ActivateResumeThemeCommand, ResumeThemesDto> handler,
            CancellationToken cancellationToken) =>
        {
            ActivateResumeThemeCommand command = new(id);

            Result<ResumeThemesDto> result = await handler.Handle(command, cancellationToken);

            return result.Match(themes => Results.Ok(themes), CustomResults.Problem);
        })
        .WithTags(Tags.ResumeThemes);
    }
}
