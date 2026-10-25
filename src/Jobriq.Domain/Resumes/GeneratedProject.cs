namespace Jobriq.Domain.Resumes;

public sealed class GeneratedProject
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Url { get; set; }

    public List<EnhancedBullet> Bullets { get; set; } = [];
}
