using DocumentFormat.OpenXml.Packaging;
using Jobriq.Domain.Resumes;
using Jobriq.Infrastructure.Export;
using Shouldly;

namespace Jobriq.Infrastructure.Tests.Export;

public sealed class DocxResumeExporterTests
{
    [Fact]
    public void Export_ContainsEverySectionInCliOrder()
    {
        using MemoryStream stream = new(new DocxResumeExporter().Export(CreateResume()));
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);

        string text = document.MainDocumentPart!.Document!.Body!.InnerText;

        text.ShouldContain("Jane Doe");
        text.ShouldContain("jane@example.com");
        text.ShouldContain("Built reliable systems.");
        text.ShouldContain("Engineer — Acme");
        text.ShouldContain("Enhanced: Built a thing");
        text.ShouldContain("BSc in Computer Science — State University");
        text.ShouldContain("GPA: 3.9");
        text.ShouldContain("AWS Solutions Architect — Amazon Web Services");
        text.ShouldContain("Mar 2024 – Mar 2027 · Credential ID: ABC-123 · https://example.com/verify/ABC-123");
        text.ShouldContain("Engineer of the Year — IEEE");
        text.ShouldContain("Dec 2023 · Acme");
        text.ShouldContain("Recognized for reliability work.");
        text.ShouldContain("C#, React");
        text.ShouldContain("Tool — https://example.com/tool");
        text.ShouldContain("Aug 2022 – Present · Acme");
        text.ShouldContain("Enhanced: Shipped a tool");

        text.IndexOf("Professional Summary", StringComparison.Ordinal)
            .ShouldBeLessThan(text.IndexOf("Work Experience", StringComparison.Ordinal));
        text.IndexOf("Work Experience", StringComparison.Ordinal)
            .ShouldBeLessThan(text.IndexOf("Education", StringComparison.Ordinal));
        text.IndexOf("Education", StringComparison.Ordinal)
            .ShouldBeLessThan(text.IndexOf("Licenses & Certifications", StringComparison.Ordinal));
        text.IndexOf("Licenses & Certifications", StringComparison.Ordinal)
            .ShouldBeLessThan(text.IndexOf("Honors & Awards", StringComparison.Ordinal));
        text.IndexOf("Honors & Awards", StringComparison.Ordinal)
            .ShouldBeLessThan(text.IndexOf("Skills", StringComparison.Ordinal));
        text.IndexOf("Skills", StringComparison.Ordinal)
            .ShouldBeLessThan(text.IndexOf("Projects", StringComparison.Ordinal));
    }

    [Fact]
    public void Export_DefinesWordBulletNumbering()
    {
        using MemoryStream stream = new(new DocxResumeExporter().Export(CreateResume()));
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);

        NumberingDefinitionsPart numbering = document.MainDocumentPart!.NumberingDefinitionsPart
            .ShouldNotBeNull();
        string xml = numbering.Numbering!.OuterXml;

        xml.ShouldContain("numFmt");
        xml.ShouldContain("bullet");
        xml.ShouldContain("•");
    }

    [Fact]
    public void Export_SetsCalibriAndLetterPage()
    {
        using MemoryStream stream = new(new DocxResumeExporter().Export(CreateResume()));
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);

        string documentXml = document.MainDocumentPart!.Document!.OuterXml;
        string stylesXml = document.MainDocumentPart.StyleDefinitionsPart!.Styles!.OuterXml;

        documentXml.ShouldContain("w:pgSz");
        documentXml.ShouldContain("w:w=\"12240\"");
        documentXml.ShouldContain("w:h=\"15840\"");
        stylesXml.ShouldContain("Calibri");
    }

    private static GeneratedResume CreateResume() => new()
    {
        Personal = new PersonalInfo
        {
            Name = "Jane Doe",
            Email = "jane@example.com",
            Phone = "555-0100",
            Location = "Remote"
        },
        Summary = "Built reliable systems.",
        Experience =
        [
            new GeneratedExperience
            {
                Id = Guid.NewGuid(),
                Company = "Acme",
                Title = "Engineer",
                StartDate = "2022",
                EndDate = "Present",
                Bullets =
                [
                    new EnhancedBullet
                    {
                        Original = "Built a thing",
                        Enhanced = "Enhanced: Built a thing"
                    }
                ]
            }
        ],
        Education =
        [
            new Education
            {
                Id = Guid.NewGuid(),
                School = "State University",
                Degree = "BSc",
                Field = "Computer Science",
                StartDate = "2018",
                EndDate = "2022",
                Gpa = "3.9"
            }
        ],
        Certifications =
        [
            new Certification
            {
                Id = Guid.NewGuid(),
                Name = "AWS Solutions Architect",
                IssuingOrganization = "Amazon Web Services",
                IssueDate = "Mar 2024",
                ExpirationDate = "Mar 2027",
                CredentialId = "ABC-123",
                CredentialUrl = "https://example.com/verify/ABC-123"
            }
        ],
        Awards =
        [
            new Award
            {
                Id = Guid.NewGuid(),
                Title = "Engineer of the Year",
                AssociatedWith = "Acme",
                Issuer = "IEEE",
                IssueDate = "Dec 2023",
                Description = "Recognized for reliability work."
            }
        ],
        Skills = ["C#", "React"],
        Projects =
        [
            new GeneratedProject
            {
                Id = Guid.NewGuid(),
                Name = "Tool",
                Url = "https://example.com/tool",
                StartDate = "Aug 2022",
                EndDate = "Present",
                AssociatedWith = "Acme",
                Bullets =
                [
                    new EnhancedBullet
                    {
                        Original = "Shipped a tool",
                        Enhanced = "Enhanced: Shipped a tool"
                    }
                ]
            }
        ],
        GeneratedAt = DateTimeOffset.UtcNow
    };
}
