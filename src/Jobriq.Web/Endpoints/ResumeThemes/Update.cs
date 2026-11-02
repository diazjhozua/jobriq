using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.ResumeThemes.Update;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.ResumeThemes;

internal sealed class Update : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("resume-themes/{id:guid}", async (
            Guid id,
            UpdateResumeThemeRequest request,
            ICommandHandler<UpdateResumeThemeCommand, ResumeThemesDto> handler,
            CancellationToken cancellationToken) =>
        {
            UpdateResumeThemeCommand command = new(id, request.Name, request.Styles);

            Result<ResumeThemesDto> result = await handler.Handle(command, cancellationToken);

            return result.Match(themes => Results.Ok(themes), CustomResults.Problem);
        })
        .WithTags(Tags.ResumeThemes);
    }
}
