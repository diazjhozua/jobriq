using Jobriq.Domain.PromptStyles;
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
        PromptStyleDefinition style,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<ReviewSuggestion>> ReviewProfileAsync(
        ResumeProfile profile,
        bool contactDetailsRedacted,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<EnhancedBullet>> EnhanceExperienceBulletsAsync(
        WorkExperience experience,
        PromptStyleDefinition style,
        CancellationToken cancellationToken);

    Task<EnhancedProject> EnhanceProjectAsync(
        Project project,
        PromptStyleDefinition style,
        CancellationToken cancellationToken);

    Task<string> GenerateSummaryAsync(
        IReadOnlyList<WorkExperience> experience,
        SummaryType summaryType,
        PromptStyleDefinition style,
        CancellationToken cancellationToken);

    Task<KeywordMatch> ExtractKeywordsAsync(
        string jobDescription,
        ResumeProfile profile,
        CancellationToken cancellationToken);
}
