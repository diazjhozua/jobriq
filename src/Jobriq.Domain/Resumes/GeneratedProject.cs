namespace Jobriq.Domain.Resumes;

public sealed class GeneratedProject
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Url { get; set; }

    public string StartDate { get; set; } = string.Empty;

    public string EndDate { get; set; } = string.Empty;

    public string AssociatedWith { get; set; } = string.Empty;

    public List<EnhancedBullet> Bullets { get; set; } = [];
}
