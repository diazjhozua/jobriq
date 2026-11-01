using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.PromptStyles.Delete;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.PromptStyles;

internal sealed class Delete : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete("prompt-styles/{id:guid}", async (
            Guid id,
            ICommandHandler<DeletePromptStyleCommand, PromptStylesDto> handler,
            CancellationToken cancellationToken) =>
        {
            DeletePromptStyleCommand command = new(id);

            Result<PromptStylesDto> result = await handler.Handle(command, cancellationToken);

            return result.Match(styles => Results.Ok(styles), CustomResults.Problem);
        })
        .WithTags(Tags.PromptStyles);
    }
}
