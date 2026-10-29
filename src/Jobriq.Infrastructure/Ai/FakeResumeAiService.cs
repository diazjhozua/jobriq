using Jobriq.Application.Abstractions;
using Jobriq.Application.CoverLetters.GenerateCoverLetter;
using Jobriq.Domain.Reviews;
using Jobriq.Domain.Resumes;

namespace Jobriq.Infrastructure.Ai;

internal sealed class FakeResumeAiService : IResumeAiService
{
    public void EnsureAvailable()
    {
    }

    public Task<CoverLetterDraft> GenerateCoverLetterAsync(
        ResumeProfile profile,
        string company,
        string role,
        string jobDescription,
        CancellationToken cancellationToken) =>
        Task.FromResult(new CoverLetterDraft
        {
            Closing = "Sincerely,",
            Paragraphs =
            [
                $"The {role} role at {company} stood out to me because the job description puts real weight on dependable delivery and clear communication. I like working in that kind of environment: understand the problem properly, make the reliable path the easy path, and leave the next person with less to untangle than I found.",
                "In my recent work I focused on the parts of the product customers touch every day. I worked closely with product and engineering to turn vague complaints into testable fixes, then followed through until the changes held up under real use. The payoff showed up in a calmer support queue and a team that could ship with more confidence.",
                "I also care about the quiet work that makes teams stronger. I write down decisions, keep handoffs small, and raise problems while they are still cheap to solve. That habit has helped me earn trust across disciplines and keep projects moving when priorities shifted.",
                $"What draws me to {company} is the emphasis on measurable outcomes in the job description. I want to work somewhere that values both craft and evidence, and where improving reliability is shared work rather than a cleanup task that lands on one team.",
                $"Thank you for your time and for considering my application. I would welcome the chance to discuss how my experience could help {company} keep delivering dependable results, and I would be glad to talk through where I could contribute first."
            ]
        });

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
