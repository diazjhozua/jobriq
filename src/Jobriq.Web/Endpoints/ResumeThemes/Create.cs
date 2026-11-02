using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.ResumeThemes.Create;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.ResumeThemes;

internal sealed class Create : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("resume-themes", async (
            CreateResumeThemeRequest request,
            ICommandHandler<CreateResumeThemeCommand, ResumeThemesDto> handler,
            CancellationToken cancellationToken) =>
        {
            CreateResumeThemeCommand command = new(request.Name, request.Styles);

            Result<ResumeThemesDto> result = await handler.Handle(command, cancellationToken);

            return result.Match(
                themes => Results.Created("/api/resume-themes", themes),
                CustomResults.Problem);
        })
        .WithTags(Tags.ResumeThemes);
    }
}
