using System.Text;
using Jobriq.Domain.Resumes;
using Jobriq.Infrastructure.Export;
using Shouldly;

namespace Jobriq.Infrastructure.Tests.Export;

public sealed class MarkdownResumeExporterTests
{
    [Fact]
    public void Export_MatchesCliStructure()
    {
        GeneratedResume resume = CreateResume();
        MarkdownResumeExporter exporter = new();

        byte[] bytes = exporter.Export(resume);
        string markdown = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false).GetString(bytes);

        markdown.ShouldBe(
            """
            # Jane Doe

            jane@example.com | 555-0100 | Remote
            [LinkedIn](https://linkedin.com/in/jane) | [GitHub](https://github.com/jane) | [Website](https://jane.dev)

            ---

            ## Professional Summary

            Built reliable systems.

            ---

            ## Work Experience

            ### Engineer — Acme
            *2022 – Present*

            - Enhanced: Built a thing

            ---

            ## Education

            ### BSc in Computer Science — State University
            *2018 – 2022*
            GPA: 3.9

            ---

            ## Skills

            C#, React

            ---

            ## Projects

            ### [Tool](https://example.com/tool)
            - Enhanced: Shipped a tool

            """.ReplaceLineEndings("\n"));
    }

    [Fact]
    public void Export_OmitsEmptySectionsAndEmptyLinks()
    {
        GeneratedResume resume = new()
        {
            Personal = new PersonalInfo { Name = "Jane Doe", Email = "jane@example.com" },
            GeneratedAt = DateTimeOffset.UtcNow
        };

        string markdown = Encoding.UTF8.GetString(new MarkdownResumeExporter().Export(resume));

        markdown.ShouldBe("# Jane Doe\n\njane@example.com\n".ReplaceLineEndings("\n"));
    }

    [Fact]
    public void Export_WritesUtf8WithoutBom()
    {
        byte[] bytes = new MarkdownResumeExporter().Export(new GeneratedResume
        {
            Personal = new PersonalInfo { Name = "Jane Doe" }
        });

        bytes.Take(3).ShouldNotBe([0xEF, 0xBB, 0xBF]);
    }

    private static GeneratedResume CreateResume() => new()
    {
        Personal = new PersonalInfo
        {
            Name = "Jane Doe",
            Email = "jane@example.com",
            Phone = "555-0100",
            Location = "Remote",
            LinkedIn = "https://linkedin.com/in/jane",
            GitHub = "https://github.com/jane",
            Website = "https://jane.dev"
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
        Skills = ["C#", "React"],
        Projects =
        [
            new GeneratedProject
            {
                Id = Guid.NewGuid(),
                Name = "Tool",
                Url = "https://example.com/tool",
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
