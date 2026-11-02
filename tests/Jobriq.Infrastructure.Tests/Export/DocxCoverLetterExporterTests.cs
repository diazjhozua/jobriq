using System.Globalization;
using DocumentFormat.OpenXml.Packaging;
using Jobriq.Domain.Applications;
using Jobriq.Domain.ResumeThemes;
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

        using MemoryStream stream = new(new DocxCoverLetterExporter().Export(letter, ResumeThemeCatalog.Default));
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
        using MemoryStream stream = new(new DocxCoverLetterExporter().Export(CreateLetter(), ResumeThemeCatalog.Default));
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
        using MemoryStream stream = new(new DocxCoverLetterExporter().Export(CreateLetter(), ResumeThemeCatalog.Default));
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

        using MemoryStream stream = new(new DocxCoverLetterExporter().Export(letter, ResumeThemeCatalog.Default));
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);

        document.MainDocumentPart!.Document!.Body!.InnerText.ShouldNotContain("Dear");
    }

    [Fact]
    public void Export_UsesThemeFontsColorsAndMargins()
    {
        ResumeThemeDefinition theme = new(
            Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            "Custom",
            new ResumeThemeStyles(
                nameFont: "Cambria",
                bodyFont: "Georgia",
                textColor: "#112233",
                mutedColor: "#445566",
                headingColor: "#778899",
                ruleColor: "#AABBCC",
                bodySize: 11,
                smallSize: 10,
                headingSize: 13,
                nameSize: 20,
                pageMargin: 54,
                showRules: true));

        using MemoryStream stream = new(new DocxCoverLetterExporter().Export(CreateLetter(), theme));
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);

        string documentXml = document.MainDocumentPart!.Document!.OuterXml;
        string stylesXml = document.MainDocumentPart.StyleDefinitionsPart!.Styles!.OuterXml;

        stylesXml.ShouldContain("Georgia");
        documentXml.ShouldContain("Cambria");
        documentXml.ShouldContain("112233");
        documentXml.ShouldContain("AABBCC");
        documentXml.ShouldContain("w:top=\"1080\"");
    }

    [Fact]
    public void Export_OmitsTopRuleWhenTheThemeDisablesRules()
    {
        using MemoryStream stream = new(
            new DocxCoverLetterExporter().Export(CreateLetter(), ResumeThemeCatalog.Monochrome));
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);

        document.MainDocumentPart!.Document!.Body!
            .Descendants<DocumentFormat.OpenXml.Wordprocessing.ParagraphBorders>()
            .ShouldBeEmpty();
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
