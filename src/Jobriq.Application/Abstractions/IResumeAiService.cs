using Jobriq.Application.CoverLetters.GenerateCoverLetter;
using Jobriq.Domain.Reviews;
using Jobriq.Domain.Resumes;

namespace Jobriq.Application.Abstractions;

public interface IResumeAiService
{
    void EnsureAvailable();

    Task<CoverLetterDraft> GenerateCoverLetterAsync(
        ResumeProfile profile,
        string company,
        string role,
        string jobDescription,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<ReviewSuggestion>> ReviewProfileAsync(
        ResumeProfile profile,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<EnhancedBullet>> EnhanceExperienceBulletsAsync(
        WorkExperience experience,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<EnhancedBullet>> EnhanceProjectBulletsAsync(
        Project project,
        CancellationToken cancellationToken);

    Task<string> GenerateSummaryAsync(
        IReadOnlyList<WorkExperience> experience,
        SummaryType summaryType,
        CancellationToken cancellationToken);

    Task<KeywordMatch> ExtractKeywordsAsync(
        string jobDescription,
        ResumeProfile profile,
        CancellationToken cancellationToken);
}
