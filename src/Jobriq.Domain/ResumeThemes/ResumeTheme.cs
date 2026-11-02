namespace Jobriq.Domain.ResumeThemes;

public sealed class ResumeTheme
{
    private ResumeTheme(string name, ResumeThemeStyles styles, DateTimeOffset now)
    {
        SetDetails(name, styles, now);
        CreatedAt = now;
    }

    public Guid Id { get; init; } = Guid.NewGuid();

    public string Name { get; private set; } = string.Empty;

    public ResumeThemeStyles Styles { get; private set; } = null!;

    public DateTimeOffset CreatedAt { get; init; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public static ResumeTheme Create(string name, ResumeThemeStyles styles, DateTimeOffset now) =>
        new(name, styles, now);

    public static ResumeTheme Restore(
        Guid id,
        string name,
        ResumeThemeStyles styles,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt) =>
        new(name, styles, updatedAt)
        {
            Id = id,
            CreatedAt = createdAt
        };

    public void UpdateDetails(string name, ResumeThemeStyles styles, DateTimeOffset now) =>
        SetDetails(name, styles, now);

    public ResumeThemeDefinition ToDefinition() => new(Id, Name, Styles);

    private void SetDetails(string name, ResumeThemeStyles styles, DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentNullException.ThrowIfNull(styles);

        string trimmedName = name.Trim();

        if (trimmedName.Length > ResumeThemeLimits.NameMaxLength)
        {
            throw new ArgumentException(
                $"A resume theme name cannot exceed {ResumeThemeLimits.NameMaxLength} characters.",
                nameof(name));
        }

        Name = trimmedName;
        Styles = styles;
        UpdatedAt = now;
    }
}
