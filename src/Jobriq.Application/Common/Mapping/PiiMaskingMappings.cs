using Jobriq.Contracts;
using Jobriq.Domain.PiiMasking;

namespace Jobriq.Application.Common.Mapping;

public static class PiiMaskingMappings
{
    public static PiiMaskingDto ToDto(PiiMaskingSettings settings)
    {
        ArgumentNullException.ThrowIfNull(settings);

        return new PiiMaskingDto { Enabled = settings.Enabled };
    }
}
