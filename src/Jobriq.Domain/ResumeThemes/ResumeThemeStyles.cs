using System.Globalization;

namespace Jobriq.Domain.ResumeThemes;

public sealed record ResumeThemeStyles
{
    public ResumeThemeStyles(
        string nameFont,
        string bodyFont,
        string textColor,
        string mutedColor,
        string headingColor,
        string ruleColor,
        int bodySize,
        int smallSize,
        int headingSize,
        int nameSize,
        int pageMargin,
        bool showRules)
    {
        NameFont = ResumeThemeFonts.Normalize(nameFont);
        BodyFont = ResumeThemeFonts.Normalize(bodyFont);
        TextColor = NormalizeColor(textColor, nameof(textColor));
        MutedColor = NormalizeColor(mutedColor, nameof(mutedColor));
        HeadingColor = NormalizeColor(headingColor, nameof(headingColor));
        RuleColor = NormalizeColor(ruleColor, nameof(ruleColor));
        BodySize = ValidateSize(bodySize, ResumeThemeLimits.BodySizeMin, ResumeThemeLimits.BodySizeMax, nameof(bodySize));
        SmallSize = ValidateSize(smallSize, ResumeThemeLimits.SmallSizeMin, ResumeThemeLimits.SmallSizeMax, nameof(smallSize));
        HeadingSize = ValidateSize(headingSize, ResumeThemeLimits.HeadingSizeMin, ResumeThemeLimits.HeadingSizeMax, nameof(headingSize));
        NameSize = ValidateSize(nameSize, ResumeThemeLimits.NameSizeMin, ResumeThemeLimits.NameSizeMax, nameof(nameSize));
        PageMargin = ValidateSize(pageMargin, ResumeThemeLimits.PageMarginMin, ResumeThemeLimits.PageMarginMax, nameof(pageMargin));
        ShowRules = showRules;
    }

    public string NameFont { get; }

    public string BodyFont { get; }

    public string TextColor { get; }

    public string MutedColor { get; }

    public string HeadingColor { get; }

    public string RuleColor { get; }

    public int BodySize { get; }

    public int SmallSize { get; }

    public int HeadingSize { get; }

    public int NameSize { get; }

    public int PageMargin { get; }

    public bool ShowRules { get; }

    private static string NormalizeColor(string value, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("A color is required.", parameterName);
        }

        string trimmed = value.Trim();
        string hex = trimmed.StartsWith('#') ? trimmed[1..] : trimmed;

        if (hex.Length != 6 || !int.TryParse(
                hex,
                NumberStyles.HexNumber,
                CultureInfo.InvariantCulture,
                out _))
        {
            throw new ArgumentException(
                $"\"{value}\" is not a valid #RRGGBB color.",
                parameterName);
        }

        return $"#{hex.ToUpperInvariant()}";
    }

    private static int ValidateSize(int value, int minimum, int maximum, string parameterName)
    {
        if (value < minimum || value > maximum)
        {
            throw new ArgumentException(
                $"{parameterName} must be between {minimum} and {maximum}.",
                parameterName);
        }

        return value;
    }
}
