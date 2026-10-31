using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Reviews;
using Jobriq.Domain.Resumes;
using Jobriq.Domain.State;
using Shouldly;

namespace Jobriq.Web.Tests.Contracts;

public sealed class JsonParityTests
{
    private static readonly JsonSerializerOptions WebJson = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
    };

    private static readonly Guid ExperienceId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid EducationId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid CertificationId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid AwardId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid ProjectId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly Guid ApplicationId = Guid.Parse("66666666-6666-6666-6666-666666666666");
    private static readonly Guid SuggestionId = Guid.Parse("77777777-7777-7777-7777-777777777777");
    private static readonly DateTimeOffset Timestamp =
        new(2026, 1, 2, 3, 4, 5, TimeSpan.Zero);

    [Fact]
    public void Profile_Dto_SerializesLikeDomain()
    {
        ResumeProfile profile = CreateProfile();

        AssertParity(profile, ProfileMappings.ToDto(profile));
    }

    [Fact]
    public void GeneratedResume_Dto_SerializesLikeDomain()
    {
        GeneratedResume resume = CreateGeneratedResume();

        AssertParity(resume, ResumeMappings.ToDto(resume));
    }

    [Fact]
    public void Application_Dto_SerializesLikeDomain()
    {
        JobApplication application = CreateApplication();

        AssertParity(application, ApplicationMappings.ToDto(application));
    }

    [Fact]
    public void CoverLetter_Dto_SerializesLikeDomain()
    {
        CoverLetter letter = CreateCoverLetter();

        AssertParity(letter, CoverLetterMappings.ToDto(letter));
    }

    [Fact]
    public void State_Dto_SerializesLikeDomain()
    {
        JobriqState state = new(
            CreateProfile(),
            [CreateApplication()],
            CreateGeneratedResume());

        AssertParity(state, StateMappings.ToDto(state));
    }

    [Fact]
    public void ReviewResponse_SerializesLikeDomain()
    {
        ProfileReview review = new()
        {
            Suggestions =
            [
                new ReviewSuggestion
                {
                    Id = SuggestionId,
                    Section = ReviewSection.Experience,
                    ItemId = ExperienceId,
                    BulletIndex = 0,
                    Category = ReviewCategory.Impact,
                    Title = "Quantify your impact",
                    Detail = "Add a measurable result.",
                    OriginalText = "Built a thing",
                    ProposedText = "Built a thing that cut latency 40%."
                },
                new ReviewSuggestion
                {
                    Id = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                    Section = ReviewSection.Skills,
                    Category = ReviewCategory.Clarity,
                    Title = "Group related skills",
                    Detail = "Order skills by relevance.",
                    ProposedText = null
                }
            ]
        };

        AssertParity(review, ReviewMappings.ToResponse(review));
    }

    [Fact]
    public void PersonalInfo_KeepsLowercaseLinkedInAndGitHub()
    {
        string json = JsonSerializer.Serialize(ProfileMappings.ToDto(CreateProfile()), WebJson);

        json.ShouldContain("\"linkedin\"");
        json.ShouldContain("\"github\"");
        json.Contains("\"linkedIn\"", StringComparison.Ordinal).ShouldBeFalse();
        json.Contains("\"gitHub\"", StringComparison.Ordinal).ShouldBeFalse();
    }

    [Fact]
    public void GeneratedResume_KeepsNullKeywords()
    {
        GeneratedResume resume = CreateGeneratedResume();
        resume.Keywords = null;

        string json = JsonSerializer.Serialize(ResumeMappings.ToDto(resume), WebJson);

        json.ShouldContain("\"keywords\":null");
    }

    private static void AssertParity<TDomain, TDto>(TDomain domain, TDto dto)
    {
        JsonNode? expected = JsonSerializer.SerializeToNode(domain, WebJson);
        JsonNode? actual = JsonSerializer.SerializeToNode(dto, WebJson);

        JsonNode.DeepEquals(expected, actual).ShouldBeTrue(
            $"DTO drifted from Domain.\nDomain: {expected}\nDTO: {actual}");
    }

    private static ResumeProfile CreateProfile() => new()
    {
        Personal = CreatePersonalInfo(),
        SummaryType = SummaryType.Professional,
        Summary = "Deterministic professional summary.",
        Experience =
        [
            new WorkExperience
            {
                Id = ExperienceId,
                Company = "Acme",
                Title = "Engineer",
                StartDate = "Jan 2020",
                EndDate = "Present",
                Bullets = ["Built a thing", "Fixed a thing"],
                EnhancedBullets =
                [
                    new EnhancedBullet { Original = "Built a thing", Enhanced = "Enhanced: Built a thing" }
                ]
            }
        ],
        Education =
        [
            new Education
            {
                Id = EducationId,
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
            new Certification
            {
                Id = CertificationId,
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
                Id = AwardId,
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
            new Project
            {
                Id = ProjectId,
                Name = "Tool",
                Url = "https://example.com/tool",
                StartDate = "2021",
                EndDate = "2022",
                AssociatedWith = "Personal Project",
                Bullets = ["Made it"],
                EnhancedBullets =
                [
                    new EnhancedBullet { Original = "Made it", Enhanced = "Enhanced: Made it" }
                ]
            }
        ]
    };

    private static PersonalInfo CreatePersonalInfo() => new()
    {
        Name = "Jane Doe",
        Email = "jane@example.com",
        Phone = "555-0100",
        Location = "Remote",
        LinkedIn = "https://linkedin.com/in/janedoe",
        GitHub = "https://github.com/janedoe",
        Website = "https://janedoe.dev"
    };

    private static GeneratedResume CreateGeneratedResume() => new()
    {
        Personal = CreatePersonalInfo(),
        Summary = "Deterministic professional summary.",
        Experience =
        [
            new GeneratedExperience
            {
                Id = ExperienceId,
                Company = "Acme",
                Title = "Engineer",
                StartDate = "Jan 2020",
                EndDate = "Present",
                Bullets =
                [
                    new EnhancedBullet { Original = "Built a thing", Enhanced = "Enhanced: Built a thing" }
                ]
            }
        ],
        Education = CreateProfile().Education,
        Certifications = CreateProfile().Certifications,
        Awards = CreateProfile().Awards,
        Skills = ["C#", "React"],
        Projects =
        [
            new GeneratedProject
            {
                Id = ProjectId,
                Name = "Tool",
                Url = "https://example.com/tool",
                StartDate = "2021",
                EndDate = "2022",
                AssociatedWith = "Personal Project",
                Bullets =
                [
                    new EnhancedBullet { Original = "Made it", Enhanced = "Enhanced: Made it" }
                ]
            }
        ],
        Keywords = new KeywordMatch { Matched = ["C#", "React"], Missing = ["Kubernetes"] },
        GeneratedAt = Timestamp
    };

    private static CoverLetter CreateCoverLetter() => new()
    {
        Personal = CreatePersonalInfo(),
        Company = "Acme",
        Role = "Engineer",
        Salutation = "Dear Acme Hiring Team,",
        Paragraphs = ["First paragraph.", "Second paragraph."],
        Closing = "Sincerely,",
        Signature = "Jane Doe",
        GeneratedAt = Timestamp
    };

    private static JobApplication CreateApplication() => JobApplication.Restore(
        ApplicationId,
        "Acme",
        "Engineer",
        "Build reliable systems.",
        ApplicationStatus.Interviewing,
        Timestamp,
        CreateGeneratedResume(),
        CreateCoverLetter(),
        new DateOnly(2022, 8, 1));
}
