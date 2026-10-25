using Jobriq.Application.Abstractions;
using Jobriq.Domain.Resumes;

namespace Jobriq.Infrastructure.Ai;

internal sealed class FakeResumeAiService : IResumeAiService
{
    public void EnsureAvailable()
    {
    }

    public Task<IReadOnlyList<EnhancedBullet>> EnhanceExperienceBulletsAsync(
        WorkExperience experience,
        CancellationToken cancellationToken) =>
        Task.FromResult(Enhance(experience.Bullets));

    public Task<IReadOnlyList<EnhancedBullet>> EnhanceProjectBulletsAsync(
        Project project,
        CancellationToken cancellationToken) =>
        Task.FromResult(Enhance(project.Bullets));

    public Task<string> GenerateSummaryAsync(
        IReadOnlyList<WorkExperience> experience,
        SummaryType summaryType,
        CancellationToken cancellationToken) =>
        Task.FromResult("Deterministic professional summary.");

    public Task<KeywordMatch> ExtractKeywordsAsync(
        string jobDescription,
        ResumeProfile profile,
        CancellationToken cancellationToken) =>
        Task.FromResult(new KeywordMatch
        {
            Matched = ["C#", "React"],
            Missing = ["Kubernetes"]
        });

    private static IReadOnlyList<EnhancedBullet> Enhance(IReadOnlyList<string> bullets) =>
        [.. bullets.Select(bullet => new EnhancedBullet
        {
            Original = bullet,
            Enhanced = $"Enhanced: {bullet}",
            NeedsQuantification = false
        })];
}
