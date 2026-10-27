using Jobriq.Domain.Resumes;
using Jobriq.Infrastructure.Ai;
using Shouldly;

namespace Jobriq.Infrastructure.Tests.Ai;

public sealed class PromptsTests
{
    [Fact]
    public void SystemPrompt_MatchesCliWording()
    {
        Prompts.System.ShouldStartWith(
            "You are an expert resume writer with 20 years of experience helping professionals land their dream jobs at top companies like Google, Amazon, and Microsoft.");
        Prompts.System.ShouldContain(
            "- Add quantification where possible; use [X units] as a placeholder when the user must supply the number, and set needsQuantification to true");
        Prompts.System.ShouldNotContain("\r");
    }

    [Fact]
    public void EnhanceExperience_UsesTitleCompanyAndNumberedBullets()
    {
        WorkExperience experience = new()
        {
            Company = "Acme",
            Title = "Engineer",
            Bullets = ["Built a thing", "Fixed a bug"]
        };

        string prompt = Prompts.EnhanceExperience(experience);

        prompt.ShouldContain("role of \"Engineer\" at \"Acme\"");
        prompt.ShouldContain("1. Built a thing\n2. Fixed a bug");
        prompt.ShouldContain("\"needsQuantification\": true or false");
        prompt.ShouldNotContain("\r");
    }

    [Fact]
    public void GenerateSummary_UsesObjectiveWordingWhenRequested()
    {
        WorkExperience experience = new()
        {
            Company = "Acme",
            Title = "Engineer",
            StartDate = "2022",
            EndDate = "Present",
            Bullets = ["Built a thing"],
            EnhancedBullets =
            [
                new EnhancedBullet
                {
                    Original = "Built a thing",
                    Enhanced = "Enhanced: Built a thing"
                }
            ]
        };

        string prompt = Prompts.GenerateSummary([experience], SummaryType.Objective);

        prompt.ShouldContain("objective statement for someone with less than 2 years of experience");
        prompt.ShouldContain("Engineer at Acme (2022 – Present)");
        prompt.ShouldContain("- Enhanced: Built a thing");
    }

    [Fact]
    public void ExtractKeywords_UsesOriginalProjectBullets()
    {
        ResumeProfile profile = new()
        {
            Personal = new PersonalInfo { Name = "Jane Doe" },
            Skills = ["C#"],
            Experience =
            [
                new WorkExperience
                {
                    Company = "Acme",
                    Title = "Engineer",
                    Bullets = ["Original experience bullet"],
                    EnhancedBullets =
                    [
                        new EnhancedBullet { Original = "Original", Enhanced = "Enhanced experience bullet" }
                    ]
                }
            ],
            Projects =
            [
                new Project
                {
                    Name = "Tool",
                    Bullets = ["Original project bullet"],
                    EnhancedBullets =
                    [
                        new EnhancedBullet { Original = "Original", Enhanced = "Enhanced project bullet" }
                    ]
                }
            ]
        };

        string prompt = Prompts.ExtractKeywords("Job text", profile);

        prompt.ShouldContain("Enhanced experience bullet");
        prompt.ShouldContain("Original project bullet");
        prompt.ShouldNotContain("Enhanced project bullet");
        prompt.ShouldContain("Total keywords (matched + missing) must be exactly 20");
    }

    [Fact]
    public void ReviewProfile_IncludesEverySectionAndTargets()
    {
        Guid experienceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        ResumeProfile profile = new()
        {
            Personal = new PersonalInfo
            {
                Name = "Jane Doe",
                Email = "jane@example.com",
                Phone = "555-0100",
                Location = "Remote",
                LinkedIn = "https://linkedin.com/in/jane",
                GitHub = "https://github.com/jane",
                Website = "https://jane.example.com"
            },
            SummaryType = SummaryType.Objective,
            Summary = string.Empty,
            Experience =
            [
                new WorkExperience
                {
                    Id = experienceId,
                    Company = "Acme",
                    Title = "Engineer",
                    StartDate = "2022",
                    EndDate = "Present",
                    Bullets = ["Built a thing", "Fixed a bug"]
                }
            ],
            Education =
            [
                new Education
                {
                    School = "State University",
                    Degree = "BSc",
                    Field = "Computer Science",
                    StartDate = "2018",
                    EndDate = "2022",
                    Gpa = "3.8"
                }
            ],
            Skills = ["C#", "React"],
            Projects =
            [
                new Project
                {
                    Id = projectId,
                    Name = "Jobriq",
                    Url = "https://github.com/jane/jobriq",
                    Bullets = ["Shipped a tool"]
                }
            ]
        };

        string prompt = Prompts.ReviewProfile(profile);

        prompt.ShouldContain("Jane Doe");
        prompt.ShouldContain("jane@example.com");
        prompt.ShouldContain("Type: objective");
        prompt.ShouldContain("(empty)");
        prompt.ShouldContain($"id: {experienceId}");
        prompt.ShouldContain("Engineer");
        prompt.ShouldContain("Acme");
        prompt.ShouldContain("0. Built a thing\n1. Fixed a bug");
        prompt.ShouldContain("State University");
        prompt.ShouldContain("C#, React");
        prompt.ShouldContain($"id: {projectId}");
        prompt.ShouldContain("Jobriq");
        prompt.ShouldContain("0. Shipped a tool");
        prompt.ShouldContain("job-agnostic");
        prompt.ShouldContain("proposedText");
        prompt.ShouldContain("\"suggestions\"");
        prompt.ShouldNotContain("\r");
    }

    [Fact]
    public void ReviewProfile_MarksMissingSections()
    {
        string prompt = Prompts.ReviewProfile(new ResumeProfile());

        prompt.ShouldContain("EXPERIENCE\n(none)");
        prompt.ShouldContain("EDUCATION\n(none)");
        prompt.ShouldContain("SKILLS\n(none)");
        prompt.ShouldContain("PROJECTS\n(none)");
    }
}
