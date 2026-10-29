using System.Globalization;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Jobriq.Application.Abstractions;
using Jobriq.Domain.Applications;
using static Jobriq.Infrastructure.Export.DocxTheme;

namespace Jobriq.Infrastructure.Export;

public sealed class DocxCoverLetterExporter : ICoverLetterExporter
{
    public string ContentType => "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    public string FileExtension => ".docx";

    public byte[] Export(CoverLetter letter)
    {
        using MemoryStream stream = new();

        using (WordprocessingDocument document = WordprocessingDocument.Create(
            stream,
            WordprocessingDocumentType.Document))
        {
            MainDocumentPart mainPart = document.AddMainDocumentPart();
            mainPart.Document = new Document();
            Body body = mainPart.Document.AppendChild(new Body());

            AddStyles(mainPart);
            AddHeader(body, letter.Personal);
            AddRule(body, after: "240");

            string date = letter.GeneratedAt
                .ToUniversalTime()
                .ToString("MMMM d, yyyy", CultureInfo.InvariantCulture);
            body.Append(new Paragraph(
                new ParagraphProperties(new SpacingBetweenLines { After = "240" }),
                CreateRun(date, SmallSize, MutedColor)));

            if (!string.IsNullOrWhiteSpace(letter.Salutation))
            {
                body.Append(new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "160" }),
                    CreateRun(letter.Salutation, BodySize, TextColor)));
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
                    CreateRun(paragraph, BodySize, TextColor)));
            }

            body.Append(new Paragraph(
                new ParagraphProperties(new SpacingBetweenLines { Before = "80", After = "40" }),
                CreateRun(letter.Closing ?? string.Empty, BodySize, TextColor)));

            body.Append(new Paragraph(
                new ParagraphProperties(new SpacingBetweenLines { After = "0" }),
                CreateRun(letter.Signature ?? string.Empty, BodySize, TextColor, bold: true)));

            AddPageSettings(body);
        }

        return stream.ToArray();
    }
}
