using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.ResumeThemes.Delete;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.ResumeThemes;

internal sealed class Delete : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete("resume-themes/{id:guid}", async (
            Guid id,
            ICommandHandler<DeleteResumeThemeCommand, ResumeThemesDto> handler,
            CancellationToken cancellationToken) =>
        {
            DeleteResumeThemeCommand command = new(id);

            Result<ResumeThemesDto> result = await handler.Handle(command, cancellationToken);

            return result.Match(themes => Results.Ok(themes), CustomResults.Problem);
        })
        .WithTags(Tags.ResumeThemes);
    }
}
