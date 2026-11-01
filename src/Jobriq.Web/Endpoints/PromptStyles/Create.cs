using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.PromptStyles.Create;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.PromptStyles;

internal sealed class Create : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("prompt-styles", async (
            CreatePromptStyleRequest request,
            ICommandHandler<CreatePromptStyleCommand, PromptStylesDto> handler,
            CancellationToken cancellationToken) =>
        {
            CreatePromptStyleCommand command = new(request.Name, request.Instructions);

            Result<PromptStylesDto> result = await handler.Handle(command, cancellationToken);

            return result.Match(
                styles => Results.Created("/api/prompt-styles", styles),
                CustomResults.Problem);
        })
        .WithTags(Tags.PromptStyles);
    }
}
