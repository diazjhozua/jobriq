using System.Globalization;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Jobriq.Application.Abstractions;
using Jobriq.Domain.Applications;
using Jobriq.Domain.ResumeThemes;

namespace Jobriq.Infrastructure.Export;

public sealed class DocxCoverLetterExporter : ICoverLetterExporter
{
    public string ContentType => "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    public string FileExtension => ".docx";

    public byte[] Export(CoverLetter letter, ResumeThemeDefinition theme)
    {
        ArgumentNullException.ThrowIfNull(theme);

        DocxTheme docxTheme = new(theme.Styles);
        using MemoryStream stream = new();

        using (WordprocessingDocument document = WordprocessingDocument.Create(
            stream,
            WordprocessingDocumentType.Document))
        {
            MainDocumentPart mainPart = document.AddMainDocumentPart();
            mainPart.Document = new Document();
            Body body = mainPart.Document.AppendChild(new Body());

            docxTheme.AddStyles(mainPart);
            docxTheme.AddHeader(body, letter.Personal);
            if (docxTheme.ShowRules)
            {
                docxTheme.AddRule(body, after: "240");
            }

            string date = letter.GeneratedAt
                .ToUniversalTime()
                .ToString("MMMM d, yyyy", CultureInfo.InvariantCulture);
            body.Append(new Paragraph(
                new ParagraphProperties(new SpacingBetweenLines { After = "240" }),
                docxTheme.CreateRun(date, docxTheme.SmallSize, docxTheme.MutedColor)));

            if (!string.IsNullOrWhiteSpace(letter.Salutation))
            {
                body.Append(new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "160" }),
                    docxTheme.CreateRun(letter.Salutation, docxTheme.BodySize, docxTheme.TextColor)));
            }

            foreach (string paragraph in letter.Paragraphs)
            {
                if (string.IsNullOrWhiteSpace(paragraph))
                {
                    continue;
                }

                body.Append(new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines
                    {
                        After = "160",
                        Line = "276",
                        LineRule = LineSpacingRuleValues.Auto
                    }),
                    docxTheme.CreateRun(paragraph, docxTheme.BodySize, docxTheme.TextColor)));
            }

            body.Append(new Paragraph(
                new ParagraphProperties(new SpacingBetweenLines { Before = "80", After = "40" }),
                docxTheme.CreateRun(letter.Closing ?? string.Empty, docxTheme.BodySize, docxTheme.TextColor)));

            body.Append(new Paragraph(
                new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                docxTheme.CreateRun(
                    letter.Signature ?? string.Empty,
                    docxTheme.BodySize,
                    docxTheme.TextColor,
                    bold: true)));

            docxTheme.AddPageSettings(body);
        }

        return stream.ToArray();
    }
}
