using Jobriq.Contracts;
using Jobriq.Domain.ResumeThemes;

namespace Jobriq.Application.Common.Mapping;

public static class ResumeThemeMappings
{
    public static ResumeThemesDto ToDto(ResumeThemeSettings settings)
    {
        ArgumentNullException.ThrowIfNull(settings);

        Guid activeThemeId = settings.EffectiveActiveThemeId;

        return new ResumeThemesDto
        {
            Themes = [.. settings.Themes.Select(theme => ToDto(theme, theme.Id == activeThemeId))],
            BuiltIns =
            [
                .. ResumeThemeCatalog.BuiltIns.Select(theme =>
                    ToDto(theme, theme.Id == activeThemeId))
            ],
            ActiveThemeId = activeThemeId
        };
    }

    public static ResumeThemeDto ToDto(ResumeTheme theme, bool isActive)
    {
        ArgumentNullException.ThrowIfNull(theme);

        return new ResumeThemeDto
        {
            Id = theme.Id,
            Name = theme.Name,
            Styles = ToDto(theme.Styles),
            IsActive = isActive,
            IsBuiltIn = false,
            CreatedAt = theme.CreatedAt,
            UpdatedAt = theme.UpdatedAt
        };
    }

    public static ResumeThemeDto ToDto(ResumeThemeDefinition definition, bool isActive)
    {
        ArgumentNullException.ThrowIfNull(definition);

        return new ResumeThemeDto
        {
            Id = definition.Id,
            Name = definition.Name,
            Styles = ToDto(definition.Styles),
            IsActive = isActive,
            IsBuiltIn = true
        };
    }

    public static ResumeThemeStylesDto ToDto(ResumeThemeStyles styles)
    {
        ArgumentNullException.ThrowIfNull(styles);

        return new ResumeThemeStylesDto
        {
            NameFont = styles.NameFont,
            BodyFont = styles.BodyFont,
            TextColor = styles.TextColor,
            MutedColor = styles.MutedColor,
            HeadingColor = styles.HeadingColor,
            RuleColor = styles.RuleColor,
            BodySize = styles.BodySize,
            SmallSize = styles.SmallSize,
            HeadingSize = styles.HeadingSize,
            NameSize = styles.NameSize,
            PageMargin = styles.PageMargin,
            ShowRules = styles.ShowRules
        };
    }

    public static ResumeThemeStyles ToDomain(ResumeThemeStylesDto styles)
    {
        ArgumentNullException.ThrowIfNull(styles);

        return new ResumeThemeStyles(
            styles.NameFont!,
            styles.BodyFont!,
            styles.TextColor!,
            styles.MutedColor!,
            styles.HeadingColor!,
            styles.RuleColor!,
            styles.BodySize!.Value,
            styles.SmallSize!.Value,
            styles.HeadingSize!.Value,
            styles.NameSize!.Value,
            styles.PageMargin!.Value,
            styles.ShowRules!.Value);
    }
}
