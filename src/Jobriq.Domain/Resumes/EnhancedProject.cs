namespace Jobriq.Domain.Resumes;

public sealed record EnhancedProject(
    string Description,
    IReadOnlyList<EnhancedBullet> Bullets);
