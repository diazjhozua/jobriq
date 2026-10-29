using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.CoverLetters.GenerateCoverLetter;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.CoverLetters;

public sealed class GenerateCoverLetterUseCaseTests
{
    private static readonly Guid ClientId = Guid.Parse("9f9e7e6a-0d7f-4f4d-9f5f-2a6c1f0b8e11");
    private static readonly DateTimeOffset Now = new(2026, 10, 29, 12, 0, 0, TimeSpan.Zero);

    private readonly IResumeAiService aiService = Substitute.For<IResumeAiService>();
    private readonly IJobriqRepository repository = Substitute.For<IJobriqRepository>();
    private readonly GenerateCoverLetterUseCase useCase;

    public GenerateCoverLetterUseCaseTests()
    {
        IClientContext clientContext = Substitute.For<IClientContext>();
        clientContext.ClientId.Returns(ClientId);

        useCase = new GenerateCoverLetterUseCase(
            aiService,
            repository,
            clientContext,
            new TestTimeProvider(Now));
    }

    [Fact]
    public async Task Execute_GeneratesAndPersistsLetterForCurrentClient()
    {
        JobApplication application = CreateApplication();
        repository
            .GetApplicationAsync(ClientId, application.Id, Arg.Any<CancellationToken>())
            .Returns(application);
        repository
            .GetProfileAsync(ClientId, Arg.Any<CancellationToken>())
            .Returns(CreateProfile());
        aiService
            .GenerateCoverLetterAsync(
                Arg.Any<ResumeProfile>(),
                "Acme",
                "Engineer",
                "Build reliable systems.",
                Arg.Any<CancellationToken>())
            .Returns(CreateDraft());
        repository
            .SaveCoverLetterAsync(ClientId, application.Id, Arg.Any<CoverLetter>(), Arg.Any<CancellationToken>())
            .Returns(callInfo =>
            {
                application.AttachCoverLetter(callInfo.Arg<CoverLetter>());
                return application;
            });

        JobApplication result = await useCase.ExecuteAsync(application.Id, CancellationToken.None);

        result.CoverLetter.ShouldNotBeNull();
        result.CoverLetter.Salutation.ShouldBe("Dear Acme Hiring Team,");
        result.CoverLetter.GeneratedAt.ShouldBe(Now);
        await repository.Received(1).SaveCoverLetterAsync(
            ClientId,
            application.Id,
            Arg.Any<CoverLetter>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_ThrowsWhenApplicationIsMissing()
    {
        repository
            .GetApplicationAsync(ClientId, Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((JobApplication?)null);

        await Should.ThrowAsync<JobriqResourceNotFoundException>(
            () => useCase.ExecuteAsync(Guid.NewGuid(), CancellationToken.None));

        await aiService.DidNotReceive().GenerateCoverLetterAsync(
            Arg.Any<ResumeProfile>(),
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_DoesNotSaveWhenAiIsUnavailable()
    {
        aiService
            .When(service => service.EnsureAvailable())
            .Throw(new MissingApiKeyException());

        await Should.ThrowAsync<MissingApiKeyException>(
            () => useCase.ExecuteAsync(Guid.NewGuid(), CancellationToken.None));

        await repository.DidNotReceive().SaveCoverLetterAsync(
            Arg.Any<Guid>(),
            Arg.Any<Guid>(),
            Arg.Any<CoverLetter>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_RejectsMissingNameBeforeCallingAi()
    {
        JobApplication application = CreateApplication();
        repository
            .GetApplicationAsync(ClientId, application.Id, Arg.Any<CancellationToken>())
            .Returns(application);
        repository
            .GetProfileAsync(ClientId, Arg.Any<CancellationToken>())
            .Returns(new ResumeProfile { Personal = new PersonalInfo { Name = "  " } });

        await Should.ThrowAsync<JobriqValidationException>(
            () => useCase.ExecuteAsync(application.Id, CancellationToken.None));

        await aiService.DidNotReceive().GenerateCoverLetterAsync(
            Arg.Any<ResumeProfile>(),
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_DoesNotSaveWhenDraftIsInvalid()
    {
        JobApplication application = CreateApplication();
        repository
            .GetApplicationAsync(ClientId, application.Id, Arg.Any<CancellationToken>())
            .Returns(application);
        repository
            .GetProfileAsync(ClientId, Arg.Any<CancellationToken>())
            .Returns(CreateProfile());
        CoverLetterDraft draft = CreateDraft();
        draft.Paragraphs = ["Too short."];
        aiService
            .GenerateCoverLetterAsync(
                Arg.Any<ResumeProfile>(),
                Arg.Any<string>(),
                Arg.Any<string>(),
                Arg.Any<string>(),
                Arg.Any<CancellationToken>())
            .Returns(draft);

        await Should.ThrowAsync<AiServiceException>(
            () => useCase.ExecuteAsync(application.Id, CancellationToken.None));

        await repository.DidNotReceive().SaveCoverLetterAsync(
            Arg.Any<Guid>(),
            Arg.Any<Guid>(),
            Arg.Any<CoverLetter>(),
            Arg.Any<CancellationToken>());
    }

    private static JobApplication CreateApplication() =>
        new("Acme", "Engineer", "Build reliable systems.");

    private static ResumeProfile CreateProfile() => new()
    {
        Personal = new PersonalInfo { Name = "Jane Doe", Email = "jane@example.com" }
    };

    private static CoverLetterDraft CreateDraft() => new()
    {
        Closing = "Sincerely,",
        Paragraphs =
        [
            "I build dependable systems that teams rely on every day, and I keep the work documented so decisions stay clear long after the project ships and the original author has moved on to the next thing.",
            "At Acme I shipped a platform that reduced support tickets by thirty percent while keeping the interface simple for the customers who depended on it every single day and night.",
            "I would bring that same care to this role, pairing steady delivery with close attention to the people who use the product and the engineers who maintain it afterward.",
            "My recent work on developer tooling cut build times in half, which gave the team room to test ideas without waiting and helped us release on schedule more often than before.",
            "Thank you for considering how my experience could support your roadmap, the customers you serve, and the small daily improvements that compound into real progress over time, and I would welcome the chance to talk."
        ]
    };
}
