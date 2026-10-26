using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Domain.State;

namespace Jobriq.Application.State.GetState;

public sealed class GetStateUseCase(IJobriqRepository repository, IClientContext clientContext)
{
    public Task<JobriqState> ExecuteAsync(CancellationToken cancellationToken) =>
        repository.GetStateAsync(clientContext.ClientId, cancellationToken);
}
