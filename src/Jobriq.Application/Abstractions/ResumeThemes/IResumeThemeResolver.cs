using Jobriq.Domain.ResumeThemes;

namespace Jobriq.Application.Abstractions.ResumeThemes;

public interface IResumeThemeResolver
{
    Task<ResumeThemeDefinition> ResolveAsync(CancellationToken cancellationToken);
}
