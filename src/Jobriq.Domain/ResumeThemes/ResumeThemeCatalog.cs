namespace Jobriq.Domain.ResumeThemes;

public static class ResumeThemeCatalog
{
    public static readonly Guid ClassicId = Guid.Parse("00000000-0000-0000-0000-0000000000A1");
    public static readonly Guid ModernId = Guid.Parse("00000000-0000-0000-0000-0000000000A2");
    public static readonly Guid CompactId = Guid.Parse("00000000-0000-0000-0000-0000000000A3");
    public static readonly Guid EditorialId = Guid.Parse("00000000-0000-0000-0000-0000000000A4");
    public static readonly Guid MonochromeId = Guid.Parse("00000000-0000-0000-0000-0000000000A5");

    public static ResumeThemeDefinition Default => Classic;

    public static ResumeThemeDefinition Classic { get; } = new(
        ClassicId,
        "Classic",
        new ResumeThemeStyles(
            nameFont: "Calibri",
            bodyFont: "Calibri",
            textColor: "#1A1A1A",
            mutedColor: "#666666",
            headingColor: "#1A1A1A",
            ruleColor: "#CCCCCC",
            bodySize: 11,
            smallSize: 10,
            headingSize: 13,
            nameSize: 18,
            pageMargin: 72,
            showRules: true));

    public static ResumeThemeDefinition Modern { get; } = new(
        ModernId,
        "Modern",
        new ResumeThemeStyles(
            nameFont: "Segoe UI",
            bodyFont: "Segoe UI",
            textColor: "#1F2933",
            mutedColor: "#616E7C",
            headingColor: "#102A43",
            ruleColor: "#BCCCDC",
            bodySize: 10,
            smallSize: 9,
            headingSize: 12,
            nameSize: 20,
            pageMargin: 72,
            showRules: true));

    public static ResumeThemeDefinition Compact { get; } = new(
        CompactId,
        "Compact",
        new ResumeThemeStyles(
            nameFont: "Arial",
            bodyFont: "Arial",
            textColor: "#202124",
            mutedColor: "#5F6368",
            headingColor: "#202124",
            ruleColor: "#DADCE0",
            bodySize: 10,
            smallSize: 9,
            headingSize: 11,
            nameSize: 16,
            pageMargin: 54,
            showRules: true));

    public static ResumeThemeDefinition Editorial { get; } = new(
        EditorialId,
        "Editorial",
        new ResumeThemeStyles(
            nameFont: "Georgia",
            bodyFont: "Cambria",
            textColor: "#2B2B2B",
            mutedColor: "#6B6B6B",
            headingColor: "#1F3A5F",
            ruleColor: "#C9B99A",
            bodySize: 11,
            smallSize: 10,
            headingSize: 13,
            nameSize: 20,
            pageMargin: 72,
            showRules: true));

    public static ResumeThemeDefinition Monochrome { get; } = new(
        MonochromeId,
        "Monochrome",
        new ResumeThemeStyles(
            nameFont: "Times New Roman",
            bodyFont: "Times New Roman",
            textColor: "#111111",
            mutedColor: "#555555",
            headingColor: "#111111",
            ruleColor: "#999999",
            bodySize: 11,
            smallSize: 10,
            headingSize: 12,
            nameSize: 18,
            pageMargin: 72,
            showRules: false));

    public static IReadOnlyList<ResumeThemeDefinition> BuiltIns { get; } =
    [
        Classic,
        Modern,
        Compact,
        Editorial,
        Monochrome
    ];

    public static bool IsBuiltIn(Guid id) => BuiltIns.Any(theme => theme.Id == id);

    public static bool IsReservedName(string name) =>
        BuiltIns.Any(theme => string.Equals(theme.Name, name?.Trim(), StringComparison.OrdinalIgnoreCase));

    public static ResumeThemeDefinition? Find(Guid id) =>
        BuiltIns.FirstOrDefault(theme => theme.Id == id);
}
