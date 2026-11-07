using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Applications.GenerateCoverLetter;
using Jobriq.Application.Common.Mapping;
using Jobriq.Application.PiiMasking;
using Jobriq.Application.PiiMasking.Update;
using Jobriq.Application.Profiles.Review;
using Jobriq.Application.Resumes.Generate;
using Jobriq.Contracts;
using Jobriq.Domain.Applications;
using Jobriq.Domain.PiiMasking;
using Jobriq.Domain.PromptStyles;
using Jobriq.Domain.Reviews;
using Jobriq.Domain.Resumes;
using Jobriq.SharedKernel;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.Handlers;

public sealed class PiiMaskingHandlerTests
{
    [Fact]
    public async Task Review_SendsRedactedProfileToAi()
    {
        IResumeAiService aiService = Substitute.For<IResumeAiService>();
        aiService
            .ReviewProfileAsync(
                Arg.Any<ResumeProfile>(),
                Arg.Any<bool>(),
                Arg.Any<CancellationToken>())
            .Returns(new List<ReviewSuggestion>());

        ReviewProfileCommandHandler handler = new(
            aiService,
            TestData.PiiMaskingResolver(enabled: true));

        await handler.Handle(
            new ReviewProfileCommand(TestData.Profile()),
            CancellationToken.None);

        await aiService.Received(1).ReviewProfileAsync(
            Arg.Is<ResumeProfile>(profile =>
                profile.Personal.Name == ProfileRedactor.Placeholder
                && profile.Personal.Email == ProfileRedactor.Placeholder),
            true,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Review_StripsPlaceholdersFromAiProse()
    {
        IResumeAiService aiService = Substitute.For<IResumeAiService>();
        aiService
            .ReviewProfileAsync(
                Arg.Any<ResumeProfile>(),
                Arg.Any<bool>(),
                Arg.Any<CancellationToken>())
            .Returns(new List<ReviewSuggestion>
            {
                new()
                {
                    Section = ReviewSection.Summary,
                    Category = ReviewCategory.Completeness,
                    Title = "Contact [redacted]",
                    Detail = "Use [redacted] here.",
                    ProposedText = "Hello [redacted]."
                }
            });

        ReviewProfileCommandHandler handler = new(
            aiService,
            TestData.PiiMaskingResolver(enabled: true));

        Result<ReviewProfileResponse> result = await handler.Handle(
            new ReviewProfileCommand(TestData.Profile()),
            CancellationToken.None);

        ReviewSuggestionDto suggestion = result.Value.Suggestions.Single();
        suggestion.Title.ShouldBe("Contact");
        suggestion.Detail.ShouldBe("Use here.");
        suggestion.ProposedText.ShouldBe("Hello.");
    }

    [Fact]
    public async Task Review_WhenMaskingIsOff_SendsRealProfile()
    {
        IResumeAiService aiService = Substitute.For<IResumeAiService>();
        aiService
            .ReviewProfileAsync(
                Arg.Any<ResumeProfile>(),
                Arg.Any<bool>(),
                Arg.Any<CancellationToken>())
            .Returns(new List<ReviewSuggestion>());

        ReviewProfileCommandHandler handler = new(
            aiService,
            TestData.PiiMaskingResolver(enabled: false));

        await handler.Handle(
            new ReviewProfileCommand(TestData.Profile()),
            CancellationToken.None);

        await aiService.Received(1).ReviewProfileAsync(
            Arg.Is<ResumeProfile>(profile => profile.Personal.Name == "Jane Doe"),
            false,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CoverLetter_SendsRedactedProfileButPersistsRealPersonal()
    {
        JobApplication application = JobApplication.Restore(
            TestData.ApplicationId,
            "Acme",
            "Engineer",
            "Build.",
            ApplicationStatus.Saved,
            TestData.Now,
            null);

        IResumeAiService aiService = Substitute.For<IResumeAiService>();
        aiService
            .GenerateCoverLetterAsync(
                Arg.Any<ResumeProfile>(),
                "Acme",
                "Engineer",
                "Build.",
                Arg.Any<PromptStyleDefinition>(),
                Arg.Any<CancellationToken>())
            .Returns(new CoverLetterDraft
            {
                Closing = "Sincerely,",
                Paragraphs =
                [
                    Paragraph("dependable [redacted] delivery"),
                    Paragraph("clear communication"),
                    Paragraph("measurable outcomes"),
                    Paragraph("reliable systems"),
                    Paragraph("steady collaboration")
                ]
            });

        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .GetApplicationAsync(
                TestData.ClientId,
                TestData.ApplicationId,
                Arg.Any<CancellationToken>())
            .Returns(application);
        repository
            .GetProfileAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(ProfileMappings.ToDomain(TestData.Profile()));

        CoverLetter? saved = null;
        repository
            .SaveCoverLetterAsync(
                TestData.ClientId,
                TestData.ApplicationId,
                Arg.Any<CoverLetter>(),
                Arg.Any<CancellationToken>())
            .Returns(call =>
            {
                saved = call.Arg<CoverLetter>();
                application.AttachCoverLetter(saved);
                return application;
            });

        GenerateCoverLetterCommandHandler handler = new(
            aiService,
            repository,
            ClientContext(),
            TestData.StyleResolver(),
            TestData.PiiMaskingResolver(enabled: true),
            new TestTimeProvider(TestData.Now));

        Result<ApplicationDto> result = await handler.Handle(
            new GenerateCoverLetterCommand(TestData.ApplicationId),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        await aiService.Received(1).GenerateCoverLetterAsync(
            Arg.Is<ResumeProfile>(profile =>
                profile.Personal.Name == ProfileRedactor.Placeholder
                && profile.Personal.Email == ProfileRedactor.Placeholder),
            "Acme",
            "Engineer",
            "Build.",
            Arg.Any<PromptStyleDefinition>(),
            Arg.Any<CancellationToken>());

        saved.ShouldNotBeNull();
        saved.Personal.Name.ShouldBe("Jane Doe");
        saved.Signature.ShouldBe("Jane Doe");
        saved.Paragraphs.ShouldAllBe(
            paragraph => !paragraph.Contains(ProfileRedactor.Placeholder));
    }

    [Fact]
    public async Task GenerateResume_MasksAiInputAndKeepsRealOutput()
    {
        ProfileDto profile = TestData.Profile();
        profile.Experience![0].Bullets = ["Emailed jane@example.com"];
        profile.Projects![0].Description = "Built by jane@example.com.";

        IResumeAiService aiService = Substitute.For<IResumeAiService>();
        aiService
            .EnhanceExperienceBulletsAsync(
                Arg.Any<WorkExperience>(),
                Arg.Any<PromptStyleDefinition>(),
                Arg.Any<CancellationToken>())
            .Returns(new List<EnhancedBullet>
            {
                new()
                {
                    Original = "Emailed [redacted]",
                    Enhanced = "Enhanced: Emailed [redacted]"
                }
            });
        aiService
            .EnhanceProjectAsync(
                Arg.Is<Project>(project =>
                    project.Description.Contains(ProfileRedactor.Placeholder)
                    && !project.Description.Contains("jane@example.com")),
                Arg.Any<PromptStyleDefinition>(),
                Arg.Any<CancellationToken>())
            .Returns(new EnhancedProject(
                "Enhanced: Built by [redacted].",
                [new() { Original = "Made it", Enhanced = "Enhanced: Made it" }]));
        aiService
            .GenerateSummaryAsync(
                Arg.Any<IReadOnlyList<WorkExperience>>(),
                Arg.Any<SummaryType>(),
                Arg.Any<PromptStyleDefinition>(),
                Arg.Any<CancellationToken>())
            .Returns("Generated summary.");
        aiService
            .ExtractKeywordsAsync(
                Arg.Any<string>(),
                Arg.Any<ResumeProfile>(),
                Arg.Any<CancellationToken>())
            .Returns(new KeywordMatch { Matched = ["C#"], Missing = ["Kubernetes"] });

        GenerateResumeCommandHandler handler = new(
            aiService,
            TestData.StyleResolver(),
            TestData.PiiMaskingResolver(enabled: true),
            new TestTimeProvider(TestData.Now));

        Result<GeneratedResumeDto> result = await handler.Handle(
            new GenerateResumeCommand(profile, "Build reliable systems."),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        await aiService.Received(1).EnhanceExperienceBulletsAsync(
            Arg.Is<WorkExperience>(experience =>
                experience.Bullets[0].Contains(ProfileRedactor.Placeholder)
                && !experience.Bullets[0].Contains("jane@example.com")),
            Arg.Any<PromptStyleDefinition>(),
            Arg.Any<CancellationToken>());

        result.Value.Personal!.Name.ShouldBe("Jane Doe");
        result.Value.Personal.Email.ShouldBe("jane@example.com");
        GeneratedExperienceDto experience = result.Value.Experience![0];
        experience.Bullets![0].Original.ShouldBe("Emailed jane@example.com");
        experience.Bullets[0].Enhanced.ShouldBe("Enhanced: Emailed");
        result.Value.Projects![0].Description.ShouldBe("Enhanced: Built by.");
        result.Value.Projects[0].Description.ShouldNotContain(ProfileRedactor.Placeholder);
    }

    [Fact]
    public async Task GenerateResume_FallsBackToRealProjectDescriptionWhenAiReturnsBlank()
    {
        ProfileDto profile = TestData.Profile();

        IResumeAiService aiService = Substitute.For<IResumeAiService>();
        aiService
            .EnhanceExperienceBulletsAsync(
                Arg.Any<WorkExperience>(),
                Arg.Any<PromptStyleDefinition>(),
                Arg.Any<CancellationToken>())
            .Returns(new List<EnhancedBullet>
            {
                new() { Original = "Built a thing", Enhanced = "Enhanced: Built a thing" }
            });
        aiService
            .EnhanceProjectAsync(
                Arg.Any<Project>(),
                Arg.Any<PromptStyleDefinition>(),
                Arg.Any<CancellationToken>())
            .Returns(new EnhancedProject(
                string.Empty,
                [new() { Original = "Made it", Enhanced = "Enhanced: Made it" }]));
        aiService
            .GenerateSummaryAsync(
                Arg.Any<IReadOnlyList<WorkExperience>>(),
                Arg.Any<SummaryType>(),
                Arg.Any<PromptStyleDefinition>(),
                Arg.Any<CancellationToken>())
            .Returns("Generated summary.");
        aiService
            .ExtractKeywordsAsync(
                Arg.Any<string>(),
                Arg.Any<ResumeProfile>(),
                Arg.Any<CancellationToken>())
            .Returns(new KeywordMatch { Matched = ["C#"], Missing = ["Kubernetes"] });

        GenerateResumeCommandHandler handler = new(
            aiService,
            TestData.StyleResolver(),
            TestData.PiiMaskingResolver(enabled: true),
            new TestTimeProvider(TestData.Now));

        Result<GeneratedResumeDto> result = await handler.Handle(
            new GenerateResumeCommand(profile, null),
            CancellationToken.None);

        result.Value.Projects![0].Description.ShouldBe("A small tool.");
    }

    [Fact]
    public async Task Update_SavesAndReturnsTheSetting()
    {
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .SavePiiMaskingSettingsAsync(
                TestData.ClientId,
                Arg.Any<PiiMaskingSettings>(),
                Arg.Any<CancellationToken>())
            .Returns(call => call.Arg<PiiMaskingSettings>());

        UpdatePiiMaskingCommandHandler handler = new(repository, ClientContext());

        Result<PiiMaskingDto> result = await handler.Handle(
            new UpdatePiiMaskingCommand(false),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Enabled.ShouldBeFalse();
        await repository.Received(1).SavePiiMaskingSettingsAsync(
            TestData.ClientId,
            Arg.Is<PiiMaskingSettings>(settings => !settings.Enabled),
            Arg.Any<CancellationToken>());
    }

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }

    private static string Paragraph(string topic) =>
        $"In my recent work I focused on {topic} and made sure the results were measurable and easy for the team to understand. " +
        "I documented the decisions, kept the handoffs small, and followed through until the changes held up under real use. " +
        "The outcome was calmer delivery and more confidence across the group.";
}
