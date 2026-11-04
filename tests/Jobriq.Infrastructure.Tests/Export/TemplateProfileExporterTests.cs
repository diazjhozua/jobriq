using System.Text;
using Jobriq.Domain.Resumes;
using Jobriq.Infrastructure.Export;
using Shouldly;

namespace Jobriq.Infrastructure.Tests.Export;

public sealed class TemplateProfileExporterTests
{
    [Fact]
    public void Export_MatchesImportTemplateFormat()
    {
        byte[] bytes = new TemplateProfileExporter().Export(CreateProfile());

        Encoding.UTF8.GetString(bytes).ShouldBe(
            """
            [PERSONAL]
            Name: Jane Doe
            Email: jane@example.com
            Phone: 555-0100
            Location: Remote
            LinkedIn: https://linkedin.com/in/janedoe
            GitHub: https://github.com/janedoe
            Website: https://janedoe.dev

            [SUMMARY]
            Type: professional
            Content: Built reliable systems.

            [EXPERIENCE]
            Company: Acme
            Title: Engineer
            Start: Jan 2020
            End: Present
            - Built a thing

            [EDUCATION]
            School: State University
            Degree: BS
            Field: Computer Science
            Start: 2015
            End: 2019
            GPA: 3.8

            [SKILLS]
            C#, React

            [PROJECT]
            Name: Tool
            URL: https://example.com/tool
            Start: 2021
            End: 2022
            Associated with: Personal Project
            - Made it

            """.ReplaceLineEndings("\n"));

        string text = Encoding.UTF8.GetString(bytes);
        text.ShouldNotContain("AWS Solutions Architect");
        text.ShouldNotContain("Engineer of the Year");
        text.ShouldNotContain("gained-only-skill");
    }

    [Fact]
    public void Export_ObjectiveSummary_WritesObjectiveType()
    {
        ResumeProfile profile = CreateProfile();
        profile.SummaryType = SummaryType.Objective;

        string text = Encoding.UTF8.GetString(new TemplateProfileExporter().Export(profile));

        text.ShouldContain("Type: objective");
    }

    [Fact]
    public void Export_EmptyProfile_WritesCanonicalSections()
    {
        string text = Encoding.UTF8.GetString(
            new TemplateProfileExporter().Export(new ResumeProfile()));

        text.ShouldBe(
            """
            [PERSONAL]
            Name:
            Email:
            Phone:
            Location:
            LinkedIn:
            GitHub:
            Website:

            [SUMMARY]
            Type: professional
            Content:

            [SKILLS]

            """.ReplaceLineEndings("\n"));
    }

    [Fact]
    public void Export_SkipsBlankEntries()
    {
        ResumeProfile profile = CreateProfile();
        profile.Experience =
        [
            new WorkExperience { Company = "  ", Title = "", Bullets = ["", " "] }
        ];
        profile.Education = [new Education()];
        profile.Projects = [new Project { Bullets = [] }];

        string text = Encoding.UTF8.GetString(new TemplateProfileExporter().Export(profile));

        text.ShouldNotContain("[EXPERIENCE]");
        text.ShouldNotContain("[EDUCATION]");
        text.ShouldNotContain("[PROJECT]");
    }

    [Fact]
    public void Export_CollapsesMultilineText()
    {
        ResumeProfile profile = CreateProfile();
        profile.Summary = "First line.\n\nSecond line.";
        profile.Experience[0].Bullets = ["Shipped a tool\r\nthat cut latency."];

        string text = Encoding.UTF8.GetString(new TemplateProfileExporter().Export(profile));

        text.ShouldContain("Content: First line. Second line.");
        text.ShouldContain("- Shipped a tool that cut latency.");
    }

    [Fact]
    public void Export_WritesUtf8WithoutBom()
    {
        byte[] bytes = new TemplateProfileExporter().Export(CreateProfile());

        bytes.Take(3).ShouldNotBe([0xEF, 0xBB, 0xBF]);
    }

    [Fact]
    public void Exporter_AdvertisesPlainTextExtension()
    {
        TemplateProfileExporter exporter = new();

        exporter.ContentType.ShouldBe("text/plain; charset=utf-8");
        exporter.FileExtension.ShouldBe(".txt");
    }

    private static ResumeProfile CreateProfile() => new()
    {
        Personal = new PersonalInfo
        {
            Name = "Jane Doe",
            Email = "jane@example.com",
            Phone = "555-0100",
            Location = "Remote",
            LinkedIn = "https://linkedin.com/in/janedoe",
            GitHub = "https://github.com/janedoe",
            Website = "https://janedoe.dev"
        },
        SummaryType = SummaryType.Professional,
        Summary = "Built reliable systems.",
        Experience =
        [
            new WorkExperience
            {
                Id = Guid.NewGuid(),
                Company = "Acme",
                Title = "Engineer",
                StartDate = "Jan 2020",
                EndDate = "Present",
                Bullets = ["Built a thing"],
                SkillsGained = ["gained-only-skill"]
            }
        ],
        Education =
        [
            new Education
            {
                Id = Guid.NewGuid(),
                School = "State University",
                Degree = "BS",
                Field = "Computer Science",
                StartDate = "2015",
                EndDate = "2019",
                Gpa = "3.8",
                SkillsGained = ["gained-only-skill"]
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
                CredentialUrl = "https://example.com/verify/ABC-123",
                SkillsGained = ["gained-only-skill"]
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
            new Project
            {
                Id = Guid.NewGuid(),
                Name = "Tool",
                Url = "https://example.com/tool",
                StartDate = "2021",
                EndDate = "2022",
                AssociatedWith = "Personal Project",
                Bullets = ["Made it"],
                SkillsGained = ["gained-only-skill"]
            }
        ]
    };
}
