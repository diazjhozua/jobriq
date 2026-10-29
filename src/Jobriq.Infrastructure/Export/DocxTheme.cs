using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Jobriq.Domain.Resumes;

namespace Jobriq.Infrastructure.Export;

internal static class DocxTheme
{
    public const string Font = "Calibri";
    public const string TextColor = "1A1A1A";
    public const string MutedColor = "666666";
    public const string RuleColor = "CCCCCC";
    public const string BodySize = "22";
    public const string SmallSize = "20";
    public const string HeadingSize = "26";
    public const string NameSize = "36";

    public static void AddStyles(MainDocumentPart mainPart)
    {
        StyleDefinitionsPart stylesPart = mainPart.AddNewPart<StyleDefinitionsPart>();
        stylesPart.Styles = new Styles(
            new DocDefaults(
                new RunPropertiesDefault(
                    new RunPropertiesBaseStyle(
                        new RunFonts { Ascii = Font, HighAnsi = Font, ComplexScript = Font },
                        new FontSize { Val = BodySize },
                        new Color { Val = TextColor }))));
    }

    public static void AddPageSettings(Body body) =>
        body.Append(new SectionProperties(
            new PageSize { Width = 12240U, Height = 15840U },
            new PageMargin { Top = 1440, Right = 1440, Bottom = 1440, Left = 1440 }));

    public static void AddHeader(Body body, PersonalInfo personal)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Center },
                new SpacingBetweenLines { After = "80" }),
            CreateRun(personal.Name, NameSize, TextColor, bold: true)));

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

    public static void AddRule(Body body, string after = "120") =>
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

    public static Run CreateRun(string text, string size, string color, bool bold = false)
    {
        RunProperties properties = new();
        properties.Append(new RunFonts { Ascii = Font, HighAnsi = Font });
        if (bold)
        {
            properties.Append(new Bold());
        }

        properties.Append(new Color { Val = color });
        properties.Append(new FontSize { Val = size });

        return new Run(properties, new Text(text) { Space = SpaceProcessingModeValues.Preserve });
    }
}
