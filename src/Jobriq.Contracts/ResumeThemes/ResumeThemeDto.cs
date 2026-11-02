namespace Jobriq.Contracts;

public sealed class ResumeThemeStylesDto
{
    public string? NameFont { get; set; }

    public string? BodyFont { get; set; }

    public string? TextColor { get; set; }

    public string? MutedColor { get; set; }

    public string? HeadingColor { get; set; }

    public string? RuleColor { get; set; }

    public int? BodySize { get; set; }

    public int? SmallSize { get; set; }

    public int? HeadingSize { get; set; }

    public int? NameSize { get; set; }

    public int? PageMargin { get; set; }

    public bool? ShowRules { get; set; }
}

public sealed class ResumeThemeDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public ResumeThemeStylesDto Styles { get; set; } = new();

    public bool IsActive { get; set; }

    public bool IsBuiltIn { get; set; }

    /// <summary>Null for built-in themes, which are not persisted.</summary>
    public DateTimeOffset? CreatedAt { get; set; }

    /// <summary>Null for built-in themes, which are not persisted.</summary>
    public DateTimeOffset? UpdatedAt { get; set; }
}

public sealed class ResumeThemesDto
{
    public List<ResumeThemeDto> Themes { get; set; } = [];

    public List<ResumeThemeDto> BuiltIns { get; set; } = [];

    public Guid ActiveThemeId { get; set; }
}
