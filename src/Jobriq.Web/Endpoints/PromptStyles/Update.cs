using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.PromptStyles.Update;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.PromptStyles;

internal sealed class Update : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("prompt-styles/{id:guid}", async (
            Guid id,
            UpdatePromptStyleRequest request,
            ICommandHandler<UpdatePromptStyleCommand, PromptStylesDto> handler,
            CancellationToken cancellationToken) =>
        {
            UpdatePromptStyleCommand command = new(id, request.Name, request.Instructions);

            Result<PromptStylesDto> result = await handler.Handle(command, cancellationToken);

            return result.Match(styles => Results.Ok(styles), CustomResults.Problem);
        })
        .WithTags(Tags.PromptStyles);
    }
}
