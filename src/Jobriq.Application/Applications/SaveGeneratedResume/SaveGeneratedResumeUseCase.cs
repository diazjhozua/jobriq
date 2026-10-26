using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;

namespace Jobriq.Application.Applications.SaveGeneratedResume;

public sealed class SaveGeneratedResumeUseCase(
    IJobriqRepository repository,
    IClientContext clientContext)
{
    public async Task<JobApplication> ExecuteAsync(
        Guid applicationId,
        GeneratedResume resume,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(resume);

        JobApplication? application = await repository.SaveGeneratedResumeAsync(
            clientContext.ClientId,
            applicationId,
            resume,
            cancellationToken);

        return application ?? throw new JobriqResourceNotFoundException("application", applicationId);
    }
}
