namespace Jobriq.Domain.Resumes;

public sealed class EnhancedBullet
{
    public string Original { get; set; } = string.Empty;

    public string Enhanced { get; set; } = string.Empty;

    public bool NeedsQuantification { get; set; }
}
