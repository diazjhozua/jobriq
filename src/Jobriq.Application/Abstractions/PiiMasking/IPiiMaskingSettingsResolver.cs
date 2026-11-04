using Jobriq.Domain.PiiMasking;

namespace Jobriq.Application.Abstractions.PiiMasking;

public interface IPiiMaskingSettingsResolver
{
    Task<PiiMaskingSettings> ResolveAsync(CancellationToken cancellationToken);
}
