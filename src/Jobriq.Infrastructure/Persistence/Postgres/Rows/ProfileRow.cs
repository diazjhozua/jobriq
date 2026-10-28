namespace Jobriq.Infrastructure.Persistence.Postgres.Rows;

internal sealed class ProfileRow
{
    public Guid ClientId { get; set; }

    public string? ProfileJson { get; set; }

    public string? StandaloneResumeJson { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
