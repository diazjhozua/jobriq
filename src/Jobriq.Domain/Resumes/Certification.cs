namespace Jobriq.Domain.Resumes;

public sealed class Certification
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string IssuingOrganization { get; set; } = string.Empty;

    public string IssueDate { get; set; } = string.Empty;

    public string ExpirationDate { get; set; } = string.Empty;

    public string? CredentialId { get; set; }

    public string? CredentialUrl { get; set; }
}
