namespace Jobriq.Infrastructure.Persistence.Postgres.Rows;

internal sealed class PromptStyleRow
{
    public Guid Id { get; set; }

    public Guid ClientId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Instructions { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
