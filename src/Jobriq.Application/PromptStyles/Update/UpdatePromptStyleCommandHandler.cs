using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Errors;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.PromptStyles;
using Jobriq.SharedKernel;

namespace Jobriq.Application.PromptStyles.Update;

internal sealed class UpdatePromptStyleCommandHandler(
    IJobriqRepository repository,
    IClientContext clientContext,
    TimeProvider timeProvider)
    : ICommandHandler<UpdatePromptStyleCommand, PromptStylesDto>
{
    public async Task<Result<PromptStylesDto>> Handle(
        UpdatePromptStyleCommand command,
        CancellationToken cancellationToken)
    {
        Guid clientId = clientContext.ClientId;

        PromptStyle? style = await repository.GetPromptStyleAsync(
            clientId,
            command.PromptStyleId,
            cancellationToken);

        if (style is null)
        {
            return Result.Failure<PromptStylesDto>(ErrorCatalog.PromptStyleNotFound());
        }

        bool nameTaken = await repository.PromptStyleNameExistsAsync(
            clientId,
            command.Name!,
            style.Id,
            cancellationToken);

        if (nameTaken)
        {
            return Result.Failure<PromptStylesDto>(
                ErrorCatalog.PromptStyleNameConflict(command.Name!));
        }

        style.UpdateDetails(command.Name!, command.Instructions!, timeProvider.GetUtcNow());

        PromptStyle? saved = await repository.SavePromptStyleAsync(
            clientId,
            style,
            cancellationToken);

        if (saved is null)
        {
            return Result.Failure<PromptStylesDto>(ErrorCatalog.PromptStyleNotFound());
        }

        PromptStyleSettings settings = await repository.GetPromptStylesAsync(
            clientId,
            cancellationToken);

        return PromptStyleMappings.ToDto(settings);
    }
}
