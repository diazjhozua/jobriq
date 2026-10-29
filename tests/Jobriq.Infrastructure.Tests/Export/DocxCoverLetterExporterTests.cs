using System.Globalization;
using DocumentFormat.OpenXml.Packaging;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;
using Jobriq.Infrastructure.Export;
using Shouldly;

namespace Jobriq.Infrastructure.Tests.Export;

public sealed class DocxCoverLetterExporterTests
{
    [Fact]
    public void Export_ContainsHeaderAndLetterInOrder()
    {
        CoverLetter letter = CreateLetter();

        using MemoryStream stream = new(new DocxCoverLetterExporter().Export(letter));
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);

        string text = document.MainDocumentPart!.Document!.Body!.InnerText;

        text.ShouldContain("Jane Doe");
        text.ShouldContain("jane@example.com");
        text.ShouldContain(
            letter.GeneratedAt.ToLocalTime().ToString("MMMM d, yyyy", CultureInfo.InvariantCulture));
        text.ShouldContain("Dear Acme Hiring Team,");
        text.ShouldContain("First paragraph.");
        text.ShouldContain("Second paragraph.");
        text.ShouldContain("Sincerely,");

        text.IndexOf("Jane Doe", StringComparison.Ordinal)
            .ShouldBeLessThan(text.IndexOf("Dear Acme Hiring Team,", StringComparison.Ordinal));
        text.IndexOf("Dear Acme Hiring Team,", StringComparison.Ordinal)
            .ShouldBeLessThan(text.IndexOf("First paragraph.", StringComparison.Ordinal));
        text.IndexOf("First paragraph.", StringComparison.Ordinal)
            .ShouldBeLessThan(text.IndexOf("Second paragraph.", StringComparison.Ordinal));
        text.IndexOf("Second paragraph.", StringComparison.Ordinal)
            .ShouldBeLessThan(text.IndexOf("Sincerely,", StringComparison.Ordinal));
    }

    [Fact]
    public void Export_BoldsSignature()
    {
        using MemoryStream stream = new(new DocxCoverLetterExporter().Export(CreateLetter()));
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);

        DocumentFormat.OpenXml.Wordprocessing.Paragraph last = document.MainDocumentPart!
            .Document!
            .Body!
            .Elements<DocumentFormat.OpenXml.Wordprocessing.Paragraph>()
            .Last();

        last.InnerText.ShouldBe("Jane Doe");
        last.Elements<DocumentFormat.OpenXml.Wordprocessing.Run>()
            .Single()
            .RunProperties!
            .Bold
            .ShouldNotBeNull();
    }

    [Fact]
    public void Export_SetsCalibriAndLetterPage()
    {
        using MemoryStream stream = new(new DocxCoverLetterExporter().Export(CreateLetter()));
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);

        string documentXml = document.MainDocumentPart!.Document!.OuterXml;
        string stylesXml = document.MainDocumentPart.StyleDefinitionsPart!.Styles!.OuterXml;

        documentXml.ShouldContain("w:pgSz");
        documentXml.ShouldContain("w:w=\"12240\"");
        documentXml.ShouldContain("w:h=\"15840\"");
        documentXml.ShouldContain("w:pgMar");
        stylesXml.ShouldContain("Calibri");
    }

    [Fact]
    public void Export_OmitsSalutationWhenBlank()
    {
        CoverLetter letter = CreateLetter();
        letter.Salutation = "  ";

        using MemoryStream stream = new(new DocxCoverLetterExporter().Export(letter));
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);

        document.MainDocumentPart!.Document!.Body!.InnerText.ShouldNotContain("Dear");
    }

    private static CoverLetter CreateLetter() => new()
    {
        Personal = new PersonalInfo
        {
            Name = "Jane Doe",
            Email = "jane@example.com",
            Phone = "555-0100",
            Location = "Remote"
        },
        Company = "Acme",
        Role = "Engineer",
        Salutation = "Dear Acme Hiring Team,",
        Paragraphs = ["First paragraph.", "Second paragraph."],
        Closing = "Sincerely,",
        Signature = "Jane Doe",
        GeneratedAt = new DateTimeOffset(2026, 10, 26, 12, 0, 0, TimeSpan.Zero)
    };
}
