namespace Jobriq.Domain.ResumeThemes;

public sealed record ResumeThemeDefinition(Guid Id, string Name, ResumeThemeStyles Styles)
{
    public bool IsBuiltIn => ResumeThemeCatalog.IsBuiltIn(Id);
}
