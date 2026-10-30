namespace Jobriq.Infrastructure.Persistence.Postgres.Rows;

internal sealed class ApplicationRow
{
    public Guid Id { get; set; }

    public Guid ClientId { get; set; }

    public string Company { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string JobDescription { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateOnly? AppliedDate { get; set; }

    public string? GeneratedResumeJson { get; set; }

    public string? CoverLetterJson { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
