namespace Jobriq.Domain.PromptStyles;

public sealed class PromptStyle
{
    private PromptStyle(string name, string instructions, DateTimeOffset now)
    {
        SetDetails(name, instructions, now);
        CreatedAt = now;
    }

    public Guid Id { get; init; } = Guid.NewGuid();

    public string Name { get; private set; } = string.Empty;

    public string Instructions { get; private set; } = string.Empty;

    public bool IsActive { get; private set; }

    public DateTimeOffset CreatedAt { get; init; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public static PromptStyle Create(string name, string instructions, DateTimeOffset now) =>
        new(name, instructions, now);

    public static PromptStyle Restore(
        Guid id,
        string name,
        string instructions,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
    {
        return new PromptStyle(name, instructions, updatedAt)
        {
            Id = id,
            IsActive = isActive,
            CreatedAt = createdAt,
        };
    }

    public void UpdateDetails(string name, string instructions, DateTimeOffset now) =>
        SetDetails(name, instructions, now);

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;

    public PromptStyleDefinition ToDefinition() => new(Id, Name, Instructions);

    private void SetDetails(string name, string instructions, DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(instructions);

        string trimmedName = name.Trim();
        string trimmedInstructions = instructions.Trim();

        if (trimmedName.Length > PromptStyleLimits.NameMaxLength)
        {
            throw new ArgumentException(
                $"A prompt style name cannot exceed {PromptStyleLimits.NameMaxLength} characters.",
                nameof(name));
        }

        if (trimmedInstructions.Length > PromptStyleLimits.InstructionsMaxLength)
        {
            throw new ArgumentException(
                $"Prompt style instructions cannot exceed {PromptStyleLimits.InstructionsMaxLength} characters.",
                nameof(instructions));
        }

        Name = trimmedName;
        Instructions = trimmedInstructions;
        UpdatedAt = now;
    }
}
