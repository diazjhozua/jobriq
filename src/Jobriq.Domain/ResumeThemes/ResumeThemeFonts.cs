namespace Jobriq.Domain.ResumeThemes;

public static class ResumeThemeFonts
{
    public static IReadOnlyList<string> All { get; } =
    [
        "Calibri",
        "Cambria",
        "Garamond",
        "Georgia",
        "Arial",
        "Helvetica",
        "Times New Roman",
        "Segoe UI",
        "Trebuchet MS",
        "Verdana"
    ];

    public static bool IsSupported(string? font) =>
        font is not null
        && All.Any(candidate => string.Equals(candidate, font, StringComparison.OrdinalIgnoreCase));

    public static string Normalize(string? font) =>
        All.FirstOrDefault(candidate =>
            string.Equals(candidate, font?.Trim(), StringComparison.OrdinalIgnoreCase))
        ?? throw new ArgumentException(
            $"\"{font}\" is not a supported resume theme font.",
            nameof(font));
}
