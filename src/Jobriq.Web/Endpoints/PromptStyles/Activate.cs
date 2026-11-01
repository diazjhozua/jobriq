using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.PromptStyles.Activate;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.PromptStyles;

internal sealed class Activate : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("prompt-styles/{id:guid}/activate", async (
            Guid id,
            ICommandHandler<ActivatePromptStyleCommand, PromptStylesDto> handler,
            CancellationToken cancellationToken) =>
        {
            ActivatePromptStyleCommand command = new(id);

            Result<PromptStylesDto> result = await handler.Handle(command, cancellationToken);

            return result.Match(styles => Results.Ok(styles), CustomResults.Problem);
        })
        .WithTags(Tags.PromptStyles);
    }
}
