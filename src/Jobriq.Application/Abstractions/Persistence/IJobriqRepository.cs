using Jobriq.Domain.Applications;
using Jobriq.Domain.PromptStyles;
using Jobriq.Domain.ResumeThemes;
using Jobriq.Domain.Resumes;
using Jobriq.Domain.State;

namespace Jobriq.Application.Abstractions.Persistence;

public interface IJobriqRepository
{
    Task<JobriqState> GetStateAsync(Guid clientId, CancellationToken cancellationToken);

    Task SaveProfileAsync(Guid clientId, ResumeProfile profile, CancellationToken cancellationToken);

    Task<ResumeProfile> GetProfileAsync(Guid clientId, CancellationToken cancellationToken);

    Task<JobApplication> AddApplicationAsync(
        Guid clientId,
        JobApplication application,
        CancellationToken cancellationToken);

    Task<JobApplication?> GetApplicationAsync(
        Guid clientId,
        Guid applicationId,
        CancellationToken cancellationToken);

    Task<JobApplication?> UpdateStatusAsync(
        Guid clientId,
        Guid applicationId,
        ApplicationStatus status,
        CancellationToken cancellationToken);

    Task<JobApplication?> UpdateApplicationDetailsAsync(
        Guid clientId,
        Guid applicationId,
        string company,
        string role,
        DateOnly? appliedDate,
        CancellationToken cancellationToken);

    Task<bool> DeleteApplicationAsync(
        Guid clientId,
        Guid applicationId,
        CancellationToken cancellationToken);

    Task<JobApplication?> SaveGeneratedResumeAsync(
        Guid clientId,
        Guid applicationId,
        GeneratedResume resume,
        CancellationToken cancellationToken);

    Task<GeneratedResume?> SaveStandaloneResumeAsync(
        Guid clientId,
        GeneratedResume resume,
        CancellationToken cancellationToken);

    Task<JobApplication?> SaveCoverLetterAsync(
        Guid clientId,
        Guid applicationId,
        CoverLetter letter,
        CancellationToken cancellationToken);

    Task<PromptStyleSettings> GetPromptStylesAsync(Guid clientId, CancellationToken cancellationToken);

    Task<PromptStyle?> GetPromptStyleAsync(
        Guid clientId,
        Guid promptStyleId,
        CancellationToken cancellationToken);

    Task<bool> PromptStyleNameExistsAsync(
        Guid clientId,
        string name,
        Guid? excludedPromptStyleId,
        CancellationToken cancellationToken);

    Task<PromptStyle> AddPromptStyleAsync(
        Guid clientId,
        PromptStyle style,
        CancellationToken cancellationToken);

    Task<PromptStyle?> SavePromptStyleAsync(
        Guid clientId,
        PromptStyle style,
        CancellationToken cancellationToken);

    Task<bool> DeletePromptStyleAsync(
        Guid clientId,
        Guid promptStyleId,
        CancellationToken cancellationToken);

    Task<PromptStyle?> ActivatePromptStyleAsync(
        Guid clientId,
        Guid promptStyleId,
        CancellationToken cancellationToken);

    Task<ResumeThemeSettings> GetResumeThemesAsync(Guid clientId, CancellationToken cancellationToken);

    Task<ResumeTheme?> GetResumeThemeAsync(
        Guid clientId,
        Guid resumeThemeId,
        CancellationToken cancellationToken);

    Task<bool> ResumeThemeNameExistsAsync(
        Guid clientId,
        string name,
        Guid? excludedResumeThemeId,
        CancellationToken cancellationToken);

    Task<ResumeTheme> AddResumeThemeAsync(
        Guid clientId,
        ResumeTheme theme,
        CancellationToken cancellationToken);

    Task<ResumeTheme?> SaveResumeThemeAsync(
        Guid clientId,
        ResumeTheme theme,
        CancellationToken cancellationToken);

    Task<bool> DeleteResumeThemeAsync(
        Guid clientId,
        Guid resumeThemeId,
        CancellationToken cancellationToken);

    Task<bool> ActivateResumeThemeAsync(
        Guid clientId,
        Guid resumeThemeId,
        CancellationToken cancellationToken);
}
