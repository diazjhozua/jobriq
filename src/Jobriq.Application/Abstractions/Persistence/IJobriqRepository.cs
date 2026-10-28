using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;
using Jobriq.Domain.State;

namespace Jobriq.Application.Abstractions.Persistence;

public interface IJobriqRepository
{
    Task<JobriqState> GetStateAsync(Guid clientId, CancellationToken cancellationToken);

    Task SaveProfileAsync(Guid clientId, ResumeProfile profile, CancellationToken cancellationToken);

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
}
