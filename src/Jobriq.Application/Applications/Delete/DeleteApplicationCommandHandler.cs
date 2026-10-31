using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Errors;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Applications.Delete;

internal sealed class DeleteApplicationCommandHandler(
    IJobriqRepository repository,
    IClientContext clientContext)
    : ICommandHandler<DeleteApplicationCommand>
{
    public async Task<Result> Handle(
        DeleteApplicationCommand command,
        CancellationToken cancellationToken)
    {
        bool deleted = await repository.DeleteApplicationAsync(
            clientContext.ClientId,
            command.ApplicationId,
            cancellationToken);

        return deleted
            ? Result.Success()
            : Result.Failure(ErrorCatalog.ApplicationNotFound());
    }
}
