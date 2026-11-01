using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Abstractions.PromptStyles;
using Jobriq.Domain.PromptStyles;

namespace Jobriq.Application.PromptStyles;

internal sealed class PromptStyleResolver(
    IJobriqRepository repository,
    IClientContext clientContext) : IPromptStyleResolver
{
    public async Task<PromptStyleDefinition> ResolveAsync(CancellationToken cancellationToken)
    {
        PromptStyleSettings settings = await repository.GetPromptStylesAsync(
            clientContext.ClientId,
            cancellationToken);

        return settings.ResolveActiveDefinition();
    }
}
