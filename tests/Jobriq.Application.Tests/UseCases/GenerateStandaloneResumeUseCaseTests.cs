using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Profiles.GenerateStandaloneResume;
using Jobriq.Application.Resumes.GenerateResume;
using Jobriq.Domain.Resumes;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.UseCases;

public sealed class GenerateStandaloneResumeUseCaseTests
{
    private static readonly Guid ClientId = Guid.Parse("9f9e7e6a-0d7f-4f4d-9f5f-2a6c1f0b8e11");

    private readonly IResumeAiService aiService = Substitute.For<IResumeAiService>();
    private readonly IJobriqRepository repository = Substitute.For<IJobriqRepository>();
    private readonly TestTimeProvider timeProvider =
        new(new DateTimeOffset(2026, 10, 24, 12, 0, 0, TimeSpan.Zero));
    private readonly GenerateStandaloneResumeUseCase useCase;

    public GenerateStandaloneResumeUseCaseTests()
    {
        IClientContext clientContext = Substitute.For<IClientContext>();
        clientContext.ClientId.Returns(ClientId);

        aiService
            .EnhanceExperienceBulletsAsync(Arg.Any<WorkExperience>(), Arg.Any<CancellationToken>())
            .Returns(callInfo => callInfo.Arg<WorkExperience>().Bullets
                .Select(bullet => new EnhancedBullet
                {
                    Original = bullet,
                    Enhanced = $"Enhanced: {bullet}",
                    NeedsQuantification = false
                })
                .ToList());

        useCase = new GenerateStandaloneResumeUseCase(
            new GenerateResumeUseCase(aiService, timeProvider),
            repository,
            clientContext);
    }

    [Fact]
    public async Task Execute_SavesResumeForCurrentClient()
    {
        ResumeProfile profile = CreateProfile();

        GeneratedResume result = await useCase.ExecuteAsync(
            profile,
            null,
            CancellationToken.None);

        result.Summary.ShouldBe("Summary.");
        result.Keywords.ShouldBeNull();
        await repository.Received(1).SaveStandaloneResumeAsync(
            ClientId,
            result,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_ExtractsKeywordsWhenJobDescriptionProvided()
    {
        aiService
            .ExtractKeywordsAsync("Build things.", Arg.Any<ResumeProfile>(), Arg.Any<CancellationToken>())
            .Returns(new KeywordMatch { Matched = ["C#"], Missing = ["Kubernetes"] });

        GeneratedResume result = await useCase.ExecuteAsync(
            CreateProfile(),
            "Build things.",
            CancellationToken.None);

        result.Keywords.ShouldNotBeNull();
        result.Keywords!.Missing.ShouldBe(["Kubernetes"]);
    }

    [Fact]
    public async Task Execute_SkipsKeywordsForBlankJobDescription()
    {
        await useCase.ExecuteAsync(CreateProfile(), "  ", CancellationToken.None);

        await aiService.DidNotReceive().ExtractKeywordsAsync(
            Arg.Any<string>(),
            Arg.Any<ResumeProfile>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_DoesNotSaveWhenAiIsUnavailable()
    {
        aiService
            .When(service => service.EnsureAvailable())
            .Throw(new MissingApiKeyException());

        await Should.ThrowAsync<MissingApiKeyException>(
            () => useCase.ExecuteAsync(CreateProfile(), null, CancellationToken.None));

        await repository.DidNotReceive().SaveStandaloneResumeAsync(
            Arg.Any<Guid>(),
            Arg.Any<GeneratedResume>(),
            Arg.Any<CancellationToken>());
    }

    private static ResumeProfile CreateProfile() => new()
    {
        Personal = new PersonalInfo { Name = "Jane Doe", Email = "jane@example.com" },
        Summary = "Summary.",
        Experience =
        [
            new WorkExperience
            {
                Company = "Acme",
                Title = "Engineer",
                StartDate = "2022",
                EndDate = "Present",
                Bullets = ["Built a thing"]
            }
        ],
        Skills = ["C#"]
    };
}
