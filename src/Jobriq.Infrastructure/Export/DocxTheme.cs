using System.Globalization;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Jobriq.Domain.ResumeThemes;
using Jobriq.Domain.Resumes;

namespace Jobriq.Infrastructure.Export;

internal sealed class DocxTheme
{
    private readonly ResumeThemeStyles styles;

    public DocxTheme(ResumeThemeStyles styles)
    {
        ArgumentNullException.ThrowIfNull(styles);
        this.styles = styles;
    }

    public string TextColor => Hex(styles.TextColor);

    public string MutedColor => Hex(styles.MutedColor);

    public string HeadingColor => Hex(styles.HeadingColor);

    public string RuleColor => Hex(styles.RuleColor);

    public string BodySize => HalfPoints(styles.BodySize);

    public string SmallSize => HalfPoints(styles.SmallSize);

    public string HeadingSize => HalfPoints(styles.HeadingSize);

    public string NameSize => HalfPoints(styles.NameSize);

    public bool ShowRules => styles.ShowRules;

    public void AddStyles(MainDocumentPart mainPart)
    {
        StyleDefinitionsPart stylesPart = mainPart.AddNewPart<StyleDefinitionsPart>();
        stylesPart.Styles = new Styles(
            new DocDefaults(
                new RunPropertiesDefault(
                    new RunPropertiesBaseStyle(
                        new RunFonts
                        {
                            Ascii = styles.BodyFont,
                            HighAnsi = styles.BodyFont,
                            ComplexScript = styles.BodyFont
                        },
                        new FontSize { Val = BodySize },
                        new Color { Val = TextColor }))));
    }

    public void AddPageSettings(Body body)
    {
        int verticalMargin = styles.PageMargin * 20;
        uint horizontalMargin = (uint)verticalMargin;

        body.Append(new SectionProperties(
            new PageSize { Width = 12240U, Height = 15840U },
            new PageMargin
            {
                Top = verticalMargin,
                Right = horizontalMargin,
                Bottom = verticalMargin,
                Left = horizontalMargin
            }));
    }

    public void AddHeader(Body body, PersonalInfo personal)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Center },
                new SpacingBetweenLines { After = "80" }),
            CreateRun(personal.Name, NameSize, HeadingColor, bold: true, nameFont: true)));

        string contact = string.Join(
            "  |  ",
            new[] { personal.Email, personal.Phone, personal.Location }
                .Where(value => !string.IsNullOrEmpty(value)));
        if (contact.Length > 0)
        {
            body.Append(new Paragraph(
                new ParagraphProperties(
                    new Justification { Val = JustificationValues.Center },
                    new SpacingBetweenLines { After = "60" }),
                CreateRun(contact, SmallSize, MutedColor)));
        }

        string links = string.Join(
            "  |  ",
            new[] { personal.LinkedIn, personal.GitHub, personal.Website }
                .Where(value => !string.IsNullOrEmpty(value)));
        if (links.Length > 0)
        {
            body.Append(new Paragraph(
                new ParagraphProperties(
                    new Justification { Val = JustificationValues.Center },
                    new SpacingBetweenLines { After = "160" }),
                CreateRun(links, SmallSize, MutedColor)));
        }
    }

    public void AddRule(Body body, string after = "120") =>
        body.Append(new Paragraph(
            new ParagraphProperties(
                new ParagraphBorders(
                    new BottomBorder
                    {
                        Val = BorderValues.Single,
                        Color = RuleColor,
                        Size = 4,
                        Space = 1
                    }),
                new SpacingBetweenLines { After = after })));

    public void AddSectionHeading(Body body, string text)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { Before = "240", After = "60" }),
            CreateRun(text, HeadingSize, HeadingColor, bold: true)));

        if (ShowRules)
        {
            AddRule(body);
        }
    }

    public Run CreateRun(string text, string size, string color, bool bold = false) =>
        CreateRun(text, size, color, bold, nameFont: false);

    private Run CreateRun(string text, string size, string color, bool bold, bool nameFont)
    {
        string font = nameFont ? styles.NameFont : styles.BodyFont;

        RunProperties properties = new();
        properties.Append(new RunFonts { Ascii = font, HighAnsi = font });
        if (bold)
        {
            properties.Append(new Bold());
        }

        properties.Append(new Color { Val = color });
        properties.Append(new FontSize { Val = size });

        return new Run(properties, new Text(text) { Space = SpaceProcessingModeValues.Preserve });
    }

    private static string HalfPoints(int points) =>
        (points * 2).ToString(CultureInfo.InvariantCulture);

    private static string Hex(string color) =>
        color.TrimStart('#').ToUpperInvariant();
}
