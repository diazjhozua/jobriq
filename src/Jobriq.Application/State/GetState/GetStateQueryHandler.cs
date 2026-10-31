using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.State;
using Jobriq.SharedKernel;

namespace Jobriq.Application.State.GetState;

internal sealed class GetStateQueryHandler(
    IJobriqRepository repository,
    IClientContext clientContext)
    : IQueryHandler<GetStateQuery, StateDto>
{
    public async Task<Result<StateDto>> Handle(
        GetStateQuery query,
        CancellationToken cancellationToken)
    {
        JobriqState state = await repository.GetStateAsync(clientContext.ClientId, cancellationToken);

        return StateMappings.ToDto(state);
    }
}
