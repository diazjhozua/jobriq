namespace Jobriq.Domain.Resumes;

public sealed class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string? Url { get; set; }

    public List<string> Bullets { get; set; } = [];

    public List<EnhancedBullet>? EnhancedBullets { get; set; }
}
