using Jobriq.Application.Common.Mapping;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Contracts;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Reviews;
using Jobriq.Domain.Resumes;
using Jobriq.Domain.State;
using Shouldly;

namespace Jobriq.Application.Tests.Mapping;

public sealed class MappingTests
{
    private static readonly Guid ExperienceId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid EducationId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid CertificationId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid AwardId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid ProjectId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly Guid ApplicationId = Guid.Parse("66666666-6666-6666-6666-666666666666");
    private static readonly Guid SuggestionId = Guid.Parse("77777777-7777-7777-7777-777777777777");
    private static readonly DateTimeOffset Timestamp = new(2026, 1, 2, 3, 4, 5, TimeSpan.Zero);

    [Fact]
    public void Profile_RoundTrips()
    {
        ResumeProfile profile = CreateProfile();

        ProfileDto dto = ProfileMappings.ToDto(profile);
        ResumeProfile roundTripped = ProfileMappings.ToDomain(dto);

        roundTripped.Personal.Name.ShouldBe(profile.Personal.Name);
        roundTripped.Personal.LinkedIn.ShouldBe(profile.Personal.LinkedIn);
        roundTripped.SummaryType.ShouldBe(profile.SummaryType);
        roundTripped.Summary.ShouldBe(profile.Summary);
        roundTripped.Experience.Single().Id.ShouldBe(ExperienceId);
        roundTripped.Experience.Single().Bullets.ShouldBe(profile.Experience.Single().Bullets);
        roundTripped.Experience.Single().EnhancedBullets!.Single().Enhanced
            .ShouldBe("Enhanced: Built a thing");
        roundTripped.Education.Single().Gpa.ShouldBe("3.8");
        roundTripped.Certifications.Single().CredentialId.ShouldBe("ABC-123");
        roundTripped.Awards.Single().Issuer.ShouldBe("Acme");
        roundTripped.Skills.ShouldBe(profile.Skills);
        roundTripped.Projects.Single().AssociatedWith.ShouldBe("Personal Project");
    }

    [Fact]
    public void Profile_KeepsNullCollections()
    {
        ProfileDto dto = new()
        {
            Certifications = null,
            Awards = null,
            Skills = null
        };

        ResumeProfile profile = ProfileMappings.ToDomain(dto);

        profile.Certifications.ShouldBeNull();
        profile.Awards.ShouldBeNull();
        profile.Skills.ShouldBeNull();
    }

    [Fact]
    public void GeneratedResume_RoundTrips()
    {
        GeneratedResume resume = CreateGeneratedResume();

        GeneratedResumeDto dto = ResumeMappings.ToDto(resume);
        GeneratedResume roundTripped = ResumeMappings.ToDomain(dto);

        roundTripped.Personal.Name.ShouldBe(resume.Personal.Name);
        roundTripped.Summary.ShouldBe(resume.Summary);
        roundTripped.Experience.Single().Bullets.Single().Enhanced
            .ShouldBe("Enhanced: Built a thing");
        roundTripped.Projects.Single().Bullets.Single().Original.ShouldBe("Made it");
        roundTripped.Keywords!.Matched.ShouldBe(["C#", "React"]);
        roundTripped.Keywords.Missing.ShouldBe(["Kubernetes"]);
        roundTripped.GeneratedAt.ShouldBe(Timestamp);
    }

    [Fact]
    public void GeneratedResume_KeepsNullKeywords()
    {
        GeneratedResume resume = CreateGeneratedResume();
        resume.Keywords = null;

        GeneratedResumeDto dto = ResumeMappings.ToDto(resume);
        GeneratedResume roundTripped = ResumeMappings.ToDomain(dto);

        dto.Keywords.ShouldBeNull();
        roundTripped.Keywords.ShouldBeNull();
    }

    [Fact]
    public void Application_MapsEveryField()
    {
        JobApplication application = CreateApplication();

        ApplicationDto dto = ApplicationMappings.ToDto(application);

        dto.Id.ShouldBe(ApplicationId);
        dto.Company.ShouldBe("Acme");
        dto.Role.ShouldBe("Engineer");
        dto.JobDescription.ShouldBe("Build reliable systems.");
        dto.Status.ShouldBe(ApplicationStatusDto.Interviewing);
        dto.CreatedAt.ShouldBe(Timestamp);
        dto.AppliedDate.ShouldBe(new DateOnly(2022, 8, 1));
        dto.GeneratedResume!.Summary.ShouldBe("Deterministic professional summary.");
        dto.CoverLetter!.Signature.ShouldBe("Jane Doe");
    }

    [Fact]
    public void CoverLetter_RoundTrips()
    {
        CoverLetter letter = CreateCoverLetter();

        CoverLetterDto dto = CoverLetterMappings.ToDto(letter);
        CoverLetter roundTripped = CoverLetterMappings.ToDomain(dto);

        roundTripped.Personal.Name.ShouldBe(letter.Personal.Name);
        roundTripped.Company.ShouldBe(letter.Company);
        roundTripped.Paragraphs.ShouldBe(letter.Paragraphs);
        roundTripped.GeneratedAt.ShouldBe(Timestamp);
    }

    [Fact]
    public void State_MapsProfileApplicationsAndStandaloneResume()
    {
        JobriqState state = new(CreateProfile(), [CreateApplication()], CreateGeneratedResume());

        StateDto dto = StateMappings.ToDto(state);

        dto.Profile.Summary.ShouldBe(state.Profile.Summary);
        dto.Applications.Single().Id.ShouldBe(ApplicationId);
        dto.StandaloneResume!.Summary.ShouldBe(state.StandaloneResume!.Summary);
    }

    [Fact]
    public void Review_MapsSuggestionsAndEnums()
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
                }
            ]
        };

        ReviewProfileResponse response = ReviewMappings.ToResponse(review);

        ReviewSuggestionDto suggestion = response.Suggestions.Single();
        suggestion.Id.ShouldBe(SuggestionId);
        suggestion.Section.ShouldBe(ReviewSectionDto.Experience);
        suggestion.ItemId.ShouldBe(ExperienceId);
        suggestion.BulletIndex.ShouldBe(0);
        suggestion.Category.ShouldBe(ReviewCategoryDto.Impact);
        suggestion.OriginalText.ShouldBe("Built a thing");
        suggestion.ProposedText.ShouldBe("Built a thing that cut latency 40%.");
    }

    [Fact]
    public void EnumMappings_PreserveNamesAndOrder()
    {
        EnumMappings.Map<SummaryType, SummaryTypeDto>(SummaryType.Objective)
            .ShouldBe(SummaryTypeDto.Objective);
        EnumMappings.Map<ApplicationStatus, ApplicationStatusDto>(ApplicationStatus.Rejected)
            .ShouldBe(ApplicationStatusDto.Rejected);
        EnumMappings.Map<ReviewSection, ReviewSectionDto>(ReviewSection.Certifications)
            .ShouldBe(ReviewSectionDto.Certifications);
        EnumMappings.Map<ReviewCategory, ReviewCategoryDto>(ReviewCategory.Clarity)
            .ShouldBe(ReviewCategoryDto.Clarity);
        EnumMappings.Map<ExportFormat, ExportFormatDto>(ExportFormat.Markdown)
            .ShouldBe(ExportFormatDto.Markdown);
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
                Bullets = ["Built a thing"],
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
