using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;
using Jobriq.Domain.State;

namespace Jobriq.Web.Tests;

internal sealed class InMemoryJobriqRepository : IJobriqRepository
{
    private readonly Dictionary<Guid, ResumeProfile> profiles = [];
    private readonly Dictionary<Guid, GeneratedResume> standaloneResumes = [];
    private readonly Dictionary<Guid, (Guid ClientId, JobApplication Application)> applications = [];
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

            return Task.FromResult<JobriqState>(
                new JobriqState(profile, clientApplications, standaloneResume));
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
