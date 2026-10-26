using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Domain.Applications;

namespace Jobriq.Application.Applications.UpdateApplicationStatus;

public sealed class UpdateApplicationStatusUseCase(
    IJobriqRepository repository,
    IClientContext clientContext)
{
    public async Task<JobApplication> ExecuteAsync(
        Guid applicationId,
        ApplicationStatus status,
        CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(status))
        {
            throw new ArgumentOutOfRangeException(nameof(status), status, "Unknown application status.");
        }

        JobApplication? application = await repository.UpdateStatusAsync(
            clientContext.ClientId,
            applicationId,
            status,
            cancellationToken);

        return application ?? throw new JobriqResourceNotFoundException("application", applicationId);
    }
}
