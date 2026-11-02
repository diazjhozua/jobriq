namespace Jobriq.Infrastructure.Persistence.Postgres.Rows;

internal sealed class ResumeThemeRow
{
    public Guid Id { get; set; }

    public Guid ClientId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string StylesJson { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
