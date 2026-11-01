using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Errors;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.PromptStyles;
using Jobriq.SharedKernel;

namespace Jobriq.Application.PromptStyles.Delete;

internal sealed class DeletePromptStyleCommandHandler(
    IJobriqRepository repository,
    IClientContext clientContext)
    : ICommandHandler<DeletePromptStyleCommand, PromptStylesDto>
{
    public async Task<Result<PromptStylesDto>> Handle(
        DeletePromptStyleCommand command,
        CancellationToken cancellationToken)
    {
        Guid clientId = clientContext.ClientId;

        bool deleted = await repository.DeletePromptStyleAsync(
            clientId,
            command.PromptStyleId,
            cancellationToken);

        if (!deleted)
        {
            return Result.Failure<PromptStylesDto>(ErrorCatalog.PromptStyleNotFound());
        }

        PromptStyleSettings settings = await repository.GetPromptStylesAsync(
            clientId,
            cancellationToken);

        return PromptStyleMappings.ToDto(settings);
    }
}
