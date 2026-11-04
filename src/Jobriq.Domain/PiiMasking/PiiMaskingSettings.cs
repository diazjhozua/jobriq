namespace Jobriq.Domain.PiiMasking;

public sealed record PiiMaskingSettings(bool Enabled)
{
    public static PiiMaskingSettings Default { get; } = new(true);
}
