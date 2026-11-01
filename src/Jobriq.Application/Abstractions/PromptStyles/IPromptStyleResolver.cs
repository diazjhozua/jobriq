using Jobriq.Domain.PromptStyles;

namespace Jobriq.Application.Abstractions.PromptStyles;

public interface IPromptStyleResolver
{
    Task<PromptStyleDefinition> ResolveAsync(CancellationToken cancellationToken);
}
