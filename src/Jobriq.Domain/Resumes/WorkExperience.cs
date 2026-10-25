namespace Jobriq.Domain.Resumes;

public sealed class WorkExperience
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Company { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string StartDate { get; set; } = string.Empty;

    public string EndDate { get; set; } = string.Empty;

    public List<string> Bullets { get; set; } = [];

    public List<EnhancedBullet>? EnhancedBullets { get; set; }
}
