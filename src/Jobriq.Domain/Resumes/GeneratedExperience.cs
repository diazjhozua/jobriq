namespace Jobriq.Domain.Resumes;

public sealed class GeneratedExperience
{
    public Guid Id { get; set; }

    public string Company { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string StartDate { get; set; } = string.Empty;

    public string EndDate { get; set; } = string.Empty;

    public List<EnhancedBullet> Bullets { get; set; } = [];
}
