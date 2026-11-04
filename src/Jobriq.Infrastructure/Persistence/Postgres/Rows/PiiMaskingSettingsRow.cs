namespace Jobriq.Infrastructure.Persistence.Postgres.Rows;

internal sealed class PiiMaskingSettingsRow
{
    public Guid ClientId { get; set; }

    public bool Enabled { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
