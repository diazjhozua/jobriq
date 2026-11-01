using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Domain.Applications;
using Jobriq.Domain.PromptStyles;
using Jobriq.Domain.Resumes;
using Jobriq.Domain.State;

namespace Jobriq.Web.Tests;

internal sealed class InMemoryJobriqRepository : IJobriqRepository
{
    private readonly Dictionary<Guid, ResumeProfile> profiles = [];
    private readonly Dictionary<Guid, GeneratedResume> standaloneResumes = [];
    private readonly Dictionary<Guid, (Guid ClientId, JobApplication Application)> applications = [];
    private readonly Dictionary<Guid, (Guid ClientId, PromptStyle Style)> promptStyles = [];
    private readonly object gate = new();

    public bool Unavailable { get; set; }

    public Task<JobriqState> GetStateAsync(Guid clientId, CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            ResumeProfile profile = profiles.TryGetValue(clientId, out ResumeProfile? storedProfile)
                ? storedProfile
                : new ResumeProfile();

            JobApplication[] clientApplications =
            [
                .. applications.Values
                    .Where(entry => entry.ClientId == clientId)
                    .Select(entry => entry.Application)
                    .OrderByDescending(application => application.CreatedAt)
            ];

            GeneratedResume? standaloneResume =
                standaloneResumes.TryGetValue(clientId, out GeneratedResume? storedResume)
                    ? storedResume
                    : null;

            PromptStyle[] clientStyles =
            [
                .. promptStyles.Values
                    .Where(entry => entry.ClientId == clientId)
                    .Select(entry => entry.Style)
                    .OrderBy(style => style.CreatedAt)
            ];

            Guid? activeStyleId = clientStyles.FirstOrDefault(style => style.IsActive)?.Id;

            return Task.FromResult<JobriqState>(
                new JobriqState(
                    profile,
                    clientApplications,
                    standaloneResume,
                    new PromptStyleSettings(clientStyles, activeStyleId)));
        }
    }

    public Task SaveProfileAsync(
        Guid clientId,
        ResumeProfile profile,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            profiles[clientId] = profile;
        }

        return Task.CompletedTask;
    }

    public Task<ResumeProfile> GetProfileAsync(Guid clientId, CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            ResumeProfile profile = profiles.TryGetValue(clientId, out ResumeProfile? storedProfile)
                ? storedProfile
                : new ResumeProfile();

            return Task.FromResult(profile);
        }
    }

    public Task<JobApplication> AddApplicationAsync(
        Guid clientId,
        JobApplication application,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            applications[application.Id] = (clientId, application);
        }

        return Task.FromResult(application);
    }

    public Task<JobApplication?> GetApplicationAsync(
        Guid clientId,
        Guid applicationId,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            return Task.FromResult(Find(clientId, applicationId));
        }
    }

    public Task<JobApplication?> UpdateStatusAsync(
        Guid clientId,
        Guid applicationId,
        ApplicationStatus status,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            JobApplication? application = Find(clientId, applicationId);
            application?.ChangeStatus(status);

            return Task.FromResult(application);
        }
    }

    public Task<JobApplication?> UpdateApplicationDetailsAsync(
        Guid clientId,
        Guid applicationId,
        string company,
        string role,
        DateOnly? appliedDate,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            JobApplication? application = Find(clientId, applicationId);
            application?.UpdateDetails(company, role, appliedDate);

            return Task.FromResult(application);
        }
    }

    public Task<bool> DeleteApplicationAsync(
        Guid clientId,
        Guid applicationId,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            if (Find(clientId, applicationId) is null)
            {
                return Task.FromResult(false);
            }

            applications.Remove(applicationId);

            return Task.FromResult(true);
        }
    }

    public Task<JobApplication?> SaveGeneratedResumeAsync(
        Guid clientId,
        Guid applicationId,
        GeneratedResume resume,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            JobApplication? application = Find(clientId, applicationId);
            application?.AttachGeneratedResume(resume);

            return Task.FromResult(application);
        }
    }

    public Task<GeneratedResume?> SaveStandaloneResumeAsync(
        Guid clientId,
        GeneratedResume resume,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            standaloneResumes[clientId] = resume;
        }

        return Task.FromResult<GeneratedResume?>(resume);
    }

    public Task<JobApplication?> SaveCoverLetterAsync(
        Guid clientId,
        Guid applicationId,
        CoverLetter letter,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            JobApplication? application = Find(clientId, applicationId);
            application?.AttachCoverLetter(letter);

            return Task.FromResult(application);
        }
    }

    public Task<PromptStyleSettings> GetPromptStylesAsync(
        Guid clientId,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            PromptStyle[] styles =
            [
                .. promptStyles.Values
                    .Where(entry => entry.ClientId == clientId)
                    .Select(entry => entry.Style)
                    .OrderBy(style => style.CreatedAt)
            ];

            Guid? activeStyleId = styles.FirstOrDefault(style => style.IsActive)?.Id;

            return Task.FromResult(new PromptStyleSettings(styles, activeStyleId));
        }
    }

    public Task<PromptStyle?> GetPromptStyleAsync(
        Guid clientId,
        Guid promptStyleId,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            return Task.FromResult(FindPromptStyle(clientId, promptStyleId));
        }
    }

    public Task<bool> PromptStyleNameExistsAsync(
        Guid clientId,
        string name,
        Guid? excludedPromptStyleId,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            string normalizedName = name.Trim();

            return Task.FromResult(
                promptStyles.Values.Any(entry =>
                    entry.ClientId == clientId
                    && entry.Style.Id != excludedPromptStyleId
                    && string.Equals(
                        entry.Style.Name,
                        normalizedName,
                        StringComparison.OrdinalIgnoreCase)));
        }
    }

    public Task<PromptStyle> AddPromptStyleAsync(
        Guid clientId,
        PromptStyle style,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            promptStyles[style.Id] = (clientId, style);
        }

        return Task.FromResult(style);
    }

    public Task<PromptStyle?> SavePromptStyleAsync(
        Guid clientId,
        PromptStyle style,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            if (FindPromptStyle(clientId, style.Id) is null)
            {
                return Task.FromResult<PromptStyle?>(null);
            }

            promptStyles[style.Id] = (clientId, style);

            return Task.FromResult<PromptStyle?>(style);
        }
    }

    public Task<bool> DeletePromptStyleAsync(
        Guid clientId,
        Guid promptStyleId,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            if (FindPromptStyle(clientId, promptStyleId) is null)
            {
                return Task.FromResult(false);
            }

            promptStyles.Remove(promptStyleId);

            return Task.FromResult(true);
        }
    }

    public Task<PromptStyle?> ActivatePromptStyleAsync(
        Guid clientId,
        Guid promptStyleId,
        CancellationToken cancellationToken)
    {
        ThrowIfUnavailable();

        lock (gate)
        {
            PromptStyle? target = FindPromptStyle(clientId, promptStyleId);
            if (target is null)
            {
                return Task.FromResult<PromptStyle?>(null);
            }

            foreach ((Guid owner, PromptStyle style) in promptStyles.Values.ToList())
            {
                if (owner == clientId)
                {
                    style.Deactivate();
                }
            }

            target.Activate();

            return Task.FromResult<PromptStyle?>(target);
        }
    }

    private PromptStyle? FindPromptStyle(Guid clientId, Guid promptStyleId) =>
        promptStyles.TryGetValue(promptStyleId, out (Guid ClientId, PromptStyle Style) entry)
        && entry.ClientId == clientId
            ? entry.Style
            : null;

    private JobApplication? Find(Guid clientId, Guid applicationId) =>
        applications.TryGetValue(applicationId, out (Guid ClientId, JobApplication Application) entry)
        && entry.ClientId == clientId
            ? entry.Application
            : null;

    private void ThrowIfUnavailable()
    {
        if (Unavailable)
        {
            throw new JobriqPersistenceUnavailableException(
                "The test repository is unavailable.",
                new InvalidOperationException("The test repository is unavailable."));
        }
    }
}
