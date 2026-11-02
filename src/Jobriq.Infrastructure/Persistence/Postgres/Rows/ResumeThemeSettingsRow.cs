namespace Jobriq.Infrastructure.Persistence.Postgres.Rows;

internal sealed class ResumeThemeSettingsRow
{
    public Guid ClientId { get; set; }

    public Guid? ActiveThemeId { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
