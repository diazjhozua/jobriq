namespace Jobriq.Domain.Resumes;

public sealed class Award
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Title { get; set; } = string.Empty;

    public string AssociatedWith { get; set; } = string.Empty;

    public string Issuer { get; set; } = string.Empty;

    public string IssueDate { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
}
