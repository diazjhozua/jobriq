namespace Jobriq.Domain.Resumes;

public sealed class Education
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string School { get; set; } = string.Empty;

    public string Degree { get; set; } = string.Empty;

    public string Field { get; set; } = string.Empty;

    public string StartDate { get; set; } = string.Empty;

    public string EndDate { get; set; } = string.Empty;

    public string? Gpa { get; set; }
}
