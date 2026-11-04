using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.PiiMasking;
using Jobriq.SharedKernel;

namespace Jobriq.Application.PiiMasking.Update;

internal sealed class UpdatePiiMaskingCommandHandler(
    IJobriqRepository repository,
    IClientContext clientContext)
    : ICommandHandler<UpdatePiiMaskingCommand, PiiMaskingDto>
{
    public async Task<Result<PiiMaskingDto>> Handle(
        UpdatePiiMaskingCommand command,
        CancellationToken cancellationToken)
    {
        PiiMaskingSettings settings = new(command.Enabled!.Value);

        PiiMaskingSettings saved = await repository.SavePiiMaskingSettingsAsync(
            clientContext.ClientId,
            settings,
            cancellationToken);

        return PiiMaskingMappings.ToDto(saved);
    }
}
