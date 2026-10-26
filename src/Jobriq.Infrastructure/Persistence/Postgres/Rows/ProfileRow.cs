namespace Jobriq.Infrastructure.Persistence.Postgres.Rows;

internal sealed class ProfileRow
{
    public Guid ClientId { get; set; }

    public string ProfileJson { get; set; } = string.Empty;

    public DateTimeOffset UpdatedAt { get; set; }
}
