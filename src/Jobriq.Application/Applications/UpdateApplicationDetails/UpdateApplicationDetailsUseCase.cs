using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Domain.Applications;

namespace Jobriq.Application.Applications.UpdateApplicationDetails;

public sealed class UpdateApplicationDetailsUseCase(
    IJobriqRepository repository,
    IClientContext clientContext)
{
    public async Task<JobApplication> ExecuteAsync(
        Guid applicationId,
        string company,
        string role,
        DateOnly? appliedDate,
        CancellationToken cancellationToken)
    {
        JobApplication? application = await repository.UpdateApplicationDetailsAsync(
            clientContext.ClientId,
            applicationId,
            company,
            role,
            appliedDate,
            cancellationToken);

        return application ?? throw new JobriqResourceNotFoundException("application", applicationId);
    }
}
