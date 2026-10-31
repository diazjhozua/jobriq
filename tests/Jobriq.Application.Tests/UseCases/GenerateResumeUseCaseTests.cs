using Jobriq.Application.Abstractions;
using Jobriq.Application.Resumes.GenerateResume;
using Jobriq.Domain.Resumes;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.UseCases;

public sealed class GenerateResumeUseCaseTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 24, 12, 0, 0, TimeSpan.Zero);

    private readonly IResumeAiService aiService = Substitute.For<IResumeAiService>();
    private readonly GenerateResumeUseCase useCase;

    public GenerateResumeUseCaseTests()
    {
        useCase = new GenerateResumeUseCase(aiService, new TestTimeProvider(Now));
    }

    [Fact]
    public async Task Execute_EnhancesExperienceAndProjectsWithBullets()
    {
        ResumeProfile profile = CreateProfile(
            experience: [CreateExperience(["Built a thing"])],
            projects: [CreateProject(["Shipped a tool"])]);
        StubEnhancements();

        GeneratedResume result = await useCase.ExecuteAsync(profile, null, CancellationToken.None);

        await aiService.Received(1).EnhanceExperienceBulletsAsync(
            Arg.Is<WorkExperience>(experience => experience.Bullets.Count == 1),
            Arg.Any<CancellationToken>());
        await aiService.Received(1).EnhanceProjectBulletsAsync(
            Arg.Is<Project>(project => project.Bullets.Count == 1),
            Arg.Any<CancellationToken>());

        result.Experience.Single().Bullets.Single().Enhanced.ShouldBe("Enhanced: Built a thing");
        result.Projects.Single().Bullets.Single().Enhanced.ShouldBe("Enhanced: Shipped a tool");
        result.GeneratedAt.ShouldBe(Now);
    }

    [Fact]
    public async Task Execute_SkipsEntriesWithoutBullets()
    {
        ResumeProfile profile = CreateProfile(
            experience: [CreateExperience([])],
            projects: [CreateProject([])]);

        GeneratedResume result = await useCase.ExecuteAsync(profile, null, CancellationToken.None);

        await aiService.DidNotReceive().EnhanceExperienceBulletsAsync(
            Arg.Any<WorkExperience>(),
            Arg.Any<CancellationToken>());
        await aiService.DidNotReceive().EnhanceProjectBulletsAsync(
            Arg.Any<Project>(),
            Arg.Any<CancellationToken>());
        result.Experience.Single().Bullets.ShouldBeEmpty();
        result.Projects.Single().Bullets.ShouldBeEmpty();
    }

    [Fact]
    public async Task Execute_CopiesProjectDatesAndAssociation()
    {
        ResumeProfile profile = CreateProfile(projects: [CreateProject([])]);

        GeneratedResume result = await useCase.ExecuteAsync(profile, null, CancellationToken.None);

        GeneratedProject project = result.Projects.Single();
        project.StartDate.ShouldBe("Aug 2022");
        project.EndDate.ShouldBe("Present");
        project.AssociatedWith.ShouldBe("Acme");
    }

    [Fact]
    public async Task Execute_GeneratesSummaryWhenBlankAndExperienceExists()
    {
        ResumeProfile profile = CreateProfile(
            experience: [CreateExperience(["Built a thing"])],
            summary: "  ");
        StubEnhancements();

        GeneratedResume result = await useCase.ExecuteAsync(profile, null, CancellationToken.None);

        await aiService.Received(1).GenerateSummaryAsync(
            Arg.Is<IReadOnlyList<WorkExperience>>(experience =>
                experience.Single().EnhancedBullets != null
                && experience.Single().EnhancedBullets!.Count == 1),
            SummaryType.Professional,
            Arg.Any<CancellationToken>());
        result.Summary.ShouldBe("Generated summary.");
    }

    [Fact]
    public async Task Execute_KeepsProvidedSummary()
    {
        ResumeProfile profile = CreateProfile(
            experience: [CreateExperience(["Built a thing"])],
            summary: "My own summary.");
        StubEnhancements();

        GeneratedResume result = await useCase.ExecuteAsync(profile, null, CancellationToken.None);

        await aiService.DidNotReceive().GenerateSummaryAsync(
            Arg.Any<IReadOnlyList<WorkExperience>>(),
            Arg.Any<SummaryType>(),
            Arg.Any<CancellationToken>());
        result.Summary.ShouldBe("My own summary.");
    }

    [Fact]
    public async Task Execute_DoesNotGenerateSummaryWithoutExperience()
    {
        ResumeProfile profile = CreateProfile(experience: [], summary: "");

        GeneratedResume result = await useCase.ExecuteAsync(profile, null, CancellationToken.None);

        await aiService.DidNotReceive().GenerateSummaryAsync(
            Arg.Any<IReadOnlyList<WorkExperience>>(),
            Arg.Any<SummaryType>(),
            Arg.Any<CancellationToken>());
        result.Summary.ShouldBeEmpty();
    }

    [Fact]
    public async Task Execute_CopiesCertificationsAndAwardsVerbatim()
    {
        Certification certification = CreateCertification();
        Award award = CreateAward();
        ResumeProfile profile = CreateProfile(
            certifications: [certification],
            awards: [award]);

        GeneratedResume result = await useCase.ExecuteAsync(profile, null, CancellationToken.None);

        Certification copiedCertification = result.Certifications.Single();
        copiedCertification.Id.ShouldBe(certification.Id);
        copiedCertification.Name.ShouldBe(certification.Name);
        copiedCertification.IssuingOrganization.ShouldBe(certification.IssuingOrganization);
        copiedCertification.IssueDate.ShouldBe(certification.IssueDate);
        copiedCertification.ExpirationDate.ShouldBe(certification.ExpirationDate);
        copiedCertification.CredentialId.ShouldBe(certification.CredentialId);
        copiedCertification.CredentialUrl.ShouldBe(certification.CredentialUrl);

        Award copiedAward = result.Awards.Single();
        copiedAward.Id.ShouldBe(award.Id);
        copiedAward.Title.ShouldBe(award.Title);
        copiedAward.AssociatedWith.ShouldBe(award.AssociatedWith);
        copiedAward.Issuer.ShouldBe(award.Issuer);
        copiedAward.IssueDate.ShouldBe(award.IssueDate);
        copiedAward.Description.ShouldBe(award.Description);

        await aiService.DidNotReceive().EnhanceExperienceBulletsAsync(
            Arg.Any<WorkExperience>(),
            Arg.Any<CancellationToken>());
        await aiService.DidNotReceive().EnhanceProjectBulletsAsync(
            Arg.Any<Project>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_ExtractsKeywordsWhenJobDescriptionExists()
    {
        ResumeProfile profile = CreateProfile(
            experience: [CreateExperience(["Built a thing"])],
            projects: [CreateProject(["Shipped a tool"])],
            certifications: [CreateCertification()],
            awards: [CreateAward()]);
        StubEnhancements();

        GeneratedResume result = await useCase.ExecuteAsync(
            profile,
            "Need C# and React.",
            CancellationToken.None);

        await aiService.Received(1).ExtractKeywordsAsync(
            "Need C# and React.",
            Arg.Is<ResumeProfile>(enhanced =>
                enhanced.Experience.Single().EnhancedBullets != null
                && enhanced.Experience.Single().EnhancedBullets!.Count == 1
                && enhanced.Projects.Single().EnhancedBullets != null
                && enhanced.Projects.Single().EnhancedBullets!.Count == 1
                && enhanced.Certifications.Count == 1
                && enhanced.Awards.Count == 1),
            Arg.Any<CancellationToken>());
        result.Keywords.ShouldNotBeNull();
        result.Keywords!.Matched.ShouldBe(["C#"]);
        result.Keywords.Missing.ShouldBe(["Kubernetes"]);
    }

    [Fact]
    public async Task Execute_SkipsKeywordsWithoutJobDescription()
    {
        ResumeProfile profile = CreateProfile(experience: [CreateExperience(["Built a thing"])]);
        StubEnhancements();

        GeneratedResume result = await useCase.ExecuteAsync(profile, "  ", CancellationToken.None);

        await aiService.DidNotReceive().ExtractKeywordsAsync(
            Arg.Any<string>(),
            Arg.Any<ResumeProfile>(),
            Arg.Any<CancellationToken>());
        result.Keywords.ShouldBeNull();
    }

    [Fact]
    public async Task Execute_RequiresConfiguredAiService()
    {
        aiService.When(service => service.EnsureAvailable())
            .Throw(new MissingApiKeyException());

        await Should.ThrowAsync<MissingApiKeyException>(
            () => useCase.ExecuteAsync(CreateProfile(), null, CancellationToken.None));
    }

    private void StubEnhancements()
    {
        aiService
            .EnhanceExperienceBulletsAsync(Arg.Any<WorkExperience>(), Arg.Any<CancellationToken>())
            .Returns(call => Task.FromResult<IReadOnlyList<EnhancedBullet>>(
                Enhance(call.Arg<WorkExperience>().Bullets)));
        aiService
            .EnhanceProjectBulletsAsync(Arg.Any<Project>(), Arg.Any<CancellationToken>())
            .Returns(call => Task.FromResult<IReadOnlyList<EnhancedBullet>>(
                Enhance(call.Arg<Project>().Bullets)));
        aiService
            .GenerateSummaryAsync(
                Arg.Any<IReadOnlyList<WorkExperience>>(),
                Arg.Any<SummaryType>(),
                Arg.Any<CancellationToken>())
            .Returns(Task.FromResult("Generated summary."));
        aiService
            .ExtractKeywordsAsync(
                Arg.Any<string>(),
                Arg.Any<ResumeProfile>(),
                Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(new KeywordMatch
            {
                Matched = ["C#"],
                Missing = ["Kubernetes"]
            }));
    }

    private static IReadOnlyList<EnhancedBullet> Enhance(IReadOnlyList<string> bullets) =>
        [.. bullets.Select(bullet => new EnhancedBullet
        {
            Original = bullet,
            Enhanced = $"Enhanced: {bullet}"
        })];

    private static ResumeProfile CreateProfile(
        WorkExperience[]? experience = null,
        Project[]? projects = null,
        Certification[]? certifications = null,
        Award[]? awards = null,
        string summary = "")
    {
        return new ResumeProfile
        {
            Personal = new PersonalInfo
            {
                Name = "Jane Doe",
                Email = "jane@example.com"
            },
            SummaryType = SummaryType.Professional,
            Summary = summary,
            Experience = [.. experience ?? []],
            Education = [],
            Certifications = [.. certifications ?? []],
            Awards = [.. awards ?? []],
            Skills = ["C#"],
            Projects = [.. projects ?? []]
        };
    }

    private static Certification CreateCertification() => new()
    {
        Id = Guid.NewGuid(),
        Name = "AWS Solutions Architect",
        IssuingOrganization = "Amazon Web Services",
        IssueDate = "Mar 2024",
        ExpirationDate = "Mar 2027",
        CredentialId = "ABC-123",
        CredentialUrl = "https://example.com/verify/ABC-123"
    };

    private static Award CreateAward() => new()
    {
        Id = Guid.NewGuid(),
        Title = "Engineer of the Year",
        AssociatedWith = "Acme",
        Issuer = "Acme",
        IssueDate = "Dec 2023",
        Description = "Recognized for reliability work."
    };

    private static WorkExperience CreateExperience(string[] bullets) => new()
    {
        Id = Guid.NewGuid(),
        Company = "Acme",
        Title = "Engineer",
        StartDate = "2022",
        EndDate = "Present",
        Bullets = [.. bullets]
    };

    private static Project CreateProject(string[] bullets) => new()
    {
        Id = Guid.NewGuid(),
        Name = "Tool",
        Url = "https://example.com",
        StartDate = "Aug 2022",
        EndDate = "Present",
        AssociatedWith = "Acme",
        Bullets = [.. bullets]
    };
}
