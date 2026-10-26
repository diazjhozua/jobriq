using Jobriq.Application.Abstractions.Persistence;

namespace Jobriq.Application.Applications.DeleteApplication;

public sealed class DeleteApplicationUseCase(IJobriqRepository repository, IClientContext clientContext)
{
    public async Task ExecuteAsync(Guid applicationId, CancellationToken cancellationToken)
    {
        bool deleted = await repository.DeleteApplicationAsync(
            clientContext.ClientId,
            applicationId,
            cancellationToken);

        if (!deleted)
        {
            throw new JobriqResourceNotFoundException("application", applicationId);
        }
    }
}
