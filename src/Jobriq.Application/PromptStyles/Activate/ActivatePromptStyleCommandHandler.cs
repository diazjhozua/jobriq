using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Errors;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.PromptStyles;
using Jobriq.SharedKernel;

namespace Jobriq.Application.PromptStyles.Activate;

internal sealed class ActivatePromptStyleCommandHandler(
    IJobriqRepository repository,
    IClientContext clientContext)
    : ICommandHandler<ActivatePromptStyleCommand, PromptStylesDto>
{
    public async Task<Result<PromptStylesDto>> Handle(
        ActivatePromptStyleCommand command,
        CancellationToken cancellationToken)
    {
        Guid clientId = clientContext.ClientId;

        PromptStyle? activated = await repository.ActivatePromptStyleAsync(
            clientId,
            command.PromptStyleId,
            cancellationToken);

        if (activated is null)
        {
            return Result.Failure<PromptStylesDto>(ErrorCatalog.PromptStyleNotFound());
        }

        PromptStyleSettings settings = await repository.GetPromptStylesAsync(
            clientId,
            cancellationToken);

        return PromptStyleMappings.ToDto(settings);
    }
}
