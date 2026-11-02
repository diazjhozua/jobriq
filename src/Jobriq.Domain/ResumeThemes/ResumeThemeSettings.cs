namespace Jobriq.Domain.ResumeThemes;

public sealed record ResumeThemeSettings(
    IReadOnlyList<ResumeTheme> Themes,
    Guid? ActiveThemeId)
{
    public static ResumeThemeSettings Empty { get; } = new([], null);

    public ResumeThemeDefinition ResolveActiveDefinition()
    {
        if (ActiveThemeId is { } activeId)
        {
            ResumeTheme? saved = Themes.FirstOrDefault(theme => theme.Id == activeId);
            if (saved is not null)
            {
                return saved.ToDefinition();
            }

            ResumeThemeDefinition? builtIn = ResumeThemeCatalog.Find(activeId);
            if (builtIn is not null)
            {
                return builtIn;
            }
        }

        return ResumeThemeCatalog.Default;
    }

    public Guid EffectiveActiveThemeId => ResolveActiveDefinition().Id;
}
