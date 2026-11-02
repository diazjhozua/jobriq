using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Abstractions.ResumeThemes;
using Jobriq.Domain.ResumeThemes;

namespace Jobriq.Application.ResumeThemes;

internal sealed class ResumeThemeResolver(
    IJobriqRepository repository,
    IClientContext clientContext) : IResumeThemeResolver
{
    public async Task<ResumeThemeDefinition> ResolveAsync(CancellationToken cancellationToken)
    {
        ResumeThemeSettings settings = await repository.GetResumeThemesAsync(
            clientContext.ClientId,
            cancellationToken);

        return settings.ResolveActiveDefinition();
    }
}
