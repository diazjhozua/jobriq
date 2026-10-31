using Jobriq.Contracts;

namespace Jobriq.Application.Tests;

internal static class TestData
{
    public static readonly Guid ClientId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    public static readonly Guid ApplicationId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    public static readonly Guid ExperienceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    public static readonly Guid ProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    public static readonly DateTimeOffset Now = new(2026, 1, 2, 3, 4, 5, TimeSpan.Zero);

    public static ProfileDto Profile() => new()
    {
        Personal = Personal(),
        SummaryType = SummaryTypeDto.Professional,
        Summary = string.Empty,
        Experience =
        [
            new WorkExperienceDto
            {
                Id = ExperienceId,
                Company = "Acme",
                Title = "Engineer",
                StartDate = "Jan 2020",
                EndDate = "Present",
                Bullets = ["Built a thing"]
            }
        ],
        Education =
        [
            new EducationDto
            {
                Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                School = "State University",
                Degree = "BS",
                Field = "Computer Science",
                StartDate = "2015",
                EndDate = "2019",
                Gpa = "3.8"
            }
        ],
        Certifications =
        [
            new CertificationDto
            {
                Id = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
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
            new AwardDto
            {
                Id = Guid.Parse("12121212-1212-1212-1212-121212121212"),
                Title = "Engineer of the Year",
                AssociatedWith = "Acme",
                Issuer = "Acme",
                IssueDate = "2023",
                Description = "For reliability work."
            }
        ],
        Skills = ["C#", "React"],
        Projects =
        [
            new ProjectDto
            {
                Id = ProjectId,
                Name = "Tool",
                Url = "https://example.com/tool",
                StartDate = "2021",
                EndDate = "2022",
                AssociatedWith = "Personal Project",
                Bullets = ["Made it"]
            }
        ]
    };

    public static PersonalInfoDto Personal() => new()
    {
        Name = "Jane Doe",
        Email = "jane@example.com",
        Phone = "555-0100",
        Location = "Remote",
        LinkedIn = "https://linkedin.com/in/janedoe",
        GitHub = "https://github.com/janedoe",
        Website = "https://janedoe.dev"
    };

    public static GeneratedResumeDto GeneratedResume() => new()
    {
        Personal = Personal(),
        Summary = "Deterministic professional summary.",
        Experience =
        [
            new GeneratedExperienceDto
            {
                Id = ExperienceId,
                Company = "Acme",
                Title = "Engineer",
                StartDate = "Jan 2020",
                EndDate = "Present",
                Bullets =
                [
                    new EnhancedBulletDto
                    {
                        Original = "Built a thing",
                        Enhanced = "Enhanced: Built a thing"
                    }
                ]
            }
        ],
        Education = Profile().Education,
        Certifications = Profile().Certifications,
        Awards = Profile().Awards,
        Skills = ["C#", "React"],
        Projects =
        [
            new GeneratedProjectDto
            {
                Id = ProjectId,
                Name = "Tool",
                Url = "https://example.com/tool",
                StartDate = "2021",
                EndDate = "2022",
                AssociatedWith = "Personal Project",
                Bullets =
                [
                    new EnhancedBulletDto
                    {
                        Original = "Made it",
                        Enhanced = "Enhanced: Made it"
                    }
                ]
            }
        ],
        Keywords = new KeywordMatchDto
        {
            Matched = ["C#", "React"],
            Missing = ["Kubernetes"]
        },
        GeneratedAt = Now
    };

    public static CoverLetterDto CoverLetter() => new()
    {
        Personal = Personal(),
        Company = "Acme",
        Role = "Engineer",
        Salutation = "Dear Acme Hiring Team,",
        Paragraphs = ["First paragraph.", "Second paragraph."],
        Closing = "Sincerely,",
        Signature = "Jane Doe",
        GeneratedAt = Now
    };
}
