using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Abstractions.PiiMasking;
using Jobriq.Domain.PiiMasking;

namespace Jobriq.Application.PiiMasking;

internal sealed class PiiMaskingSettingsResolver(
    IJobriqRepository repository,
    IClientContext clientContext) : IPiiMaskingSettingsResolver
{
    public Task<PiiMaskingSettings> ResolveAsync(CancellationToken cancellationToken) =>
        repository.GetPiiMaskingSettingsAsync(clientContext.ClientId, cancellationToken);
}
