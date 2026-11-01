using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Errors;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.PromptStyles;
using Jobriq.SharedKernel;

namespace Jobriq.Application.PromptStyles.Create;

internal sealed class CreatePromptStyleCommandHandler(
    IJobriqRepository repository,
    IClientContext clientContext,
    TimeProvider timeProvider)
    : ICommandHandler<CreatePromptStyleCommand, PromptStylesDto>
{
    public async Task<Result<PromptStylesDto>> Handle(
        CreatePromptStyleCommand command,
        CancellationToken cancellationToken)
    {
        Guid clientId = clientContext.ClientId;

        bool nameTaken = await repository.PromptStyleNameExistsAsync(
            clientId,
            command.Name!,
            null,
            cancellationToken);

        if (nameTaken)
        {
            return Result.Failure<PromptStylesDto>(
                ErrorCatalog.PromptStyleNameConflict(command.Name!));
        }

        PromptStyleSettings settings = await repository.GetPromptStylesAsync(
            clientId,
            cancellationToken);

        PromptStyle style = PromptStyle.Create(
            command.Name!,
            command.Instructions!,
            timeProvider.GetUtcNow());

        if (settings.Styles.Count == 0)
        {
            style.Activate();
        }

        await repository.AddPromptStyleAsync(clientId, style, cancellationToken);

        PromptStyleSettings updated = await repository.GetPromptStylesAsync(
            clientId,
            cancellationToken);

        return PromptStyleMappings.ToDto(updated);
    }
}
