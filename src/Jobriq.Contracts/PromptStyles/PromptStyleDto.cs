namespace Jobriq.Contracts;

public sealed class PromptStyleDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Instructions { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    /// <summary>Null for the built-in baseline, which is not persisted.</summary>
    public DateTimeOffset? CreatedAt { get; set; }

    /// <summary>Null for the built-in baseline, which is not persisted.</summary>
    public DateTimeOffset? UpdatedAt { get; set; }
}
