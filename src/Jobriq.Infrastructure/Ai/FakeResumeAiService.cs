using Jobriq.Application.Abstractions;
using Jobriq.Domain.Reviews;
using Jobriq.Domain.Resumes;

namespace Jobriq.Infrastructure.Ai;

internal sealed class FakeResumeAiService : IResumeAiService
{
    public void EnsureAvailable()
    {
    }

    public Task<IReadOnlyList<ReviewSuggestion>> ReviewProfileAsync(
        ResumeProfile profile,
        CancellationToken cancellationToken)
    {
        List<ReviewSuggestion> suggestions =
        [
            new ReviewSuggestion
            {
                Id = Guid.NewGuid(),
                Section = ReviewSection.Summary,
                Category = ReviewCategory.Completeness,
                Title = "Add a professional summary",
                Detail = "Summarize your experience in two or three lines.",
                OriginalText = string.IsNullOrWhiteSpace(profile.Summary) ? null : profile.Summary.Trim(),
                ProposedText = "Deterministic reviewed summary."
            }
        ];

        WorkExperience? experience = profile.Experience.FirstOrDefault(item => item.Bullets.Count > 0);
        if (experience is not null)
        {
            suggestions.Add(new ReviewSuggestion
            {
                Id = Guid.NewGuid(),
                Section = ReviewSection.Experience,
                ItemId = experience.Id,
                BulletIndex = 0,
                Category = ReviewCategory.Impact,
                Title = "Quantify your impact",
                Detail = "Add a measurable result to this bullet.",
                OriginalText = experience.Bullets[0],
                ProposedText = "Reviewed: Built a thing"
            });
        }

        suggestions.Add(new ReviewSuggestion
        {
            Id = Guid.NewGuid(),
            Section = ReviewSection.Skills,
            Category = ReviewCategory.Clarity,
            Title = "Group related skills",
            Detail = "Order skills by relevance and group related tools.",
            ProposedText = null
        });

        return Task.FromResult<IReadOnlyList<ReviewSuggestion>>(suggestions);
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
