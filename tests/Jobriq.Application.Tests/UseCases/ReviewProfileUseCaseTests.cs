using Jobriq.Application.Abstractions;
using Jobriq.Application.Profiles.ReviewProfile;
using Jobriq.Domain.Reviews;
using Jobriq.Domain.Resumes;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.UseCases;

public sealed class ReviewProfileUseCaseTests
{
    private readonly IResumeAiService aiService = Substitute.For<IResumeAiService>();
    private readonly ReviewProfileUseCase useCase;

    public ReviewProfileUseCaseTests()
    {
        useCase = new ReviewProfileUseCase(aiService);
    }

    [Fact]
    public async Task Execute_RequiresConfiguredAiServiceBeforeReviewing()
    {
        aiService.When(service => service.EnsureAvailable())
            .Throw(new MissingApiKeyException());

        await Should.ThrowAsync<MissingApiKeyException>(
            () => useCase.ExecuteAsync(CreateProfile(), CancellationToken.None));

        await aiService.DidNotReceive().ReviewProfileAsync(
            Arg.Any<ResumeProfile>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_PassesTheSubmittedProfileToTheAiService()
    {
        ResumeProfile profile = CreateProfile(summary: "My summary.");
        StubReview([]);

        await useCase.ExecuteAsync(profile, CancellationToken.None);

        aiService.Received(1).EnsureAvailable();
        await aiService.Received(1).ReviewProfileAsync(profile, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_KeepsSummaryProposalAndDerivesOriginalText()
    {
        ResumeProfile profile = CreateProfile(summary: "My summary.");
        StubReview([CreateSuggestion(ReviewSection.Summary, proposedText: "Better summary.")]);

        ProfileReview result = await useCase.ExecuteAsync(profile, CancellationToken.None);

        ReviewSuggestion suggestion = result.Suggestions.Single();
        suggestion.Section.ShouldBe(ReviewSection.Summary);
        suggestion.ItemId.ShouldBeNull();
        suggestion.BulletIndex.ShouldBeNull();
        suggestion.OriginalText.ShouldBe("My summary.");
        suggestion.ProposedText.ShouldBe("Better summary.");
        suggestion.Id.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task Execute_LeavesOriginalTextNullWhenSummaryIsBlank()
    {
        ResumeProfile profile = CreateProfile(summary: "  ");
        StubReview([CreateSuggestion(ReviewSection.Summary, proposedText: "Better summary.")]);

        ProfileReview result = await useCase.ExecuteAsync(profile, CancellationToken.None);

        result.Suggestions.Single().OriginalText.ShouldBeNull();
    }

    [Fact]
    public async Task Execute_KeepsValidExperienceProposal()
    {
        WorkExperience experience = CreateExperience(["Built a thing"]);
        ResumeProfile profile = CreateProfile(experience: [experience]);
        StubReview([
            CreateSuggestion(
                ReviewSection.Experience,
                itemId: experience.Id,
                bulletIndex: 0,
                proposedText: "Built a thing\nwith measurable impact.")
        ]);

        ReviewSuggestion suggestion = (await useCase.ExecuteAsync(profile, CancellationToken.None))
            .Suggestions.Single();

        suggestion.ItemId.ShouldBe(experience.Id);
        suggestion.BulletIndex.ShouldBe(0);
        suggestion.OriginalText.ShouldBe("Built a thing");
        suggestion.ProposedText.ShouldBe("Built a thing with measurable impact.");
    }

    [Fact]
    public async Task Execute_KeepsValidProjectProposal()
    {
        Project project = CreateProject(["Shipped a tool"]);
        ResumeProfile profile = CreateProfile(projects: [project]);
        StubReview([
            CreateSuggestion(
                ReviewSection.Projects,
                itemId: project.Id,
                bulletIndex: 0,
                proposedText: "Shipped a tool to production.")
        ]);

        ReviewSuggestion suggestion = (await useCase.ExecuteAsync(profile, CancellationToken.None))
            .Suggestions.Single();

        suggestion.ItemId.ShouldBe(project.Id);
        suggestion.BulletIndex.ShouldBe(0);
        suggestion.OriginalText.ShouldBe("Shipped a tool");
        suggestion.ProposedText.ShouldBe("Shipped a tool to production.");
    }

    [Fact]
    public async Task Execute_DropsProposalForUnknownItem()
    {
        ResumeProfile profile = CreateProfile(experience: [CreateExperience(["Built a thing"])]);
        StubReview([
            CreateSuggestion(
                ReviewSection.Experience,
                itemId: Guid.NewGuid(),
                bulletIndex: 0,
                proposedText: "Rewritten.")
        ]);

        ProfileReview result = await useCase.ExecuteAsync(profile, CancellationToken.None);

        result.Suggestions.ShouldBeEmpty();
    }

    [Fact]
    public async Task Execute_KeepsUnknownItemAsAdvisoryWithoutTargets()
    {
        ResumeProfile profile = CreateProfile(experience: [CreateExperience(["Built a thing"])]);
        StubReview([
            CreateSuggestion(ReviewSection.Experience, itemId: Guid.NewGuid(), bulletIndex: 0)
        ]);

        ReviewSuggestion suggestion = (await useCase.ExecuteAsync(profile, CancellationToken.None))
            .Suggestions.Single();

        suggestion.ItemId.ShouldBeNull();
        suggestion.BulletIndex.ShouldBeNull();
        suggestion.OriginalText.ShouldBeNull();
        suggestion.ProposedText.ShouldBeNull();
    }

    [Fact]
    public async Task Execute_DropsProposalForOutOfRangeBullet()
    {
        WorkExperience experience = CreateExperience(["Built a thing"]);
        ResumeProfile profile = CreateProfile(experience: [experience]);
        StubReview([
            CreateSuggestion(
                ReviewSection.Experience,
                itemId: experience.Id,
                bulletIndex: 3,
                proposedText: "Rewritten.")
        ]);

        ProfileReview result = await useCase.ExecuteAsync(profile, CancellationToken.None);

        result.Suggestions.ShouldBeEmpty();
    }

    [Theory]
    [InlineData(ReviewSection.Personal)]
    [InlineData(ReviewSection.Education)]
    [InlineData(ReviewSection.Skills)]
    public async Task Execute_StripsProposedTextFromAdvisorySections(ReviewSection section)
    {
        ResumeProfile profile = CreateProfile();
        StubReview([CreateSuggestion(section, proposedText: "Suggested text.")]);

        ReviewSuggestion suggestion = (await useCase.ExecuteAsync(profile, CancellationToken.None))
            .Suggestions.Single();

        suggestion.Section.ShouldBe(section);
        suggestion.ProposedText.ShouldBeNull();
        suggestion.ItemId.ShouldBeNull();
        suggestion.BulletIndex.ShouldBeNull();
        suggestion.OriginalText.ShouldBeNull();
    }

    [Fact]
    public async Task Execute_DropsSuggestionsWithoutTitle()
    {
        StubReview([CreateSuggestion(ReviewSection.Summary, title: "  ")]);

        ProfileReview result = await useCase.ExecuteAsync(CreateProfile(), CancellationToken.None);

        result.Suggestions.ShouldBeEmpty();
    }

    [Fact]
    public async Task Execute_TurnsBlankProposedTextIntoNull()
    {
        StubReview([CreateSuggestion(ReviewSection.Summary, proposedText: "   ")]);

        ReviewSuggestion suggestion = (await useCase.ExecuteAsync(CreateProfile(), CancellationToken.None))
            .Suggestions.Single();

        suggestion.ProposedText.ShouldBeNull();
    }

    [Fact]
    public async Task Execute_CapsSuggestionsAtTwenty()
    {
        StubReview(
        [
            .. Enumerable.Range(0, 25)
                .Select(index => CreateSuggestion(ReviewSection.Summary, title: $"Suggestion {index}"))
        ]);

        ProfileReview result = await useCase.ExecuteAsync(CreateProfile(), CancellationToken.None);

        result.Suggestions.Count.ShouldBe(20);
    }

    [Fact]
    public async Task Execute_AssignsFreshIds()
    {
        Guid aiId = Guid.NewGuid();
        StubReview([CreateSuggestion(ReviewSection.Summary, id: aiId)]);

        ReviewSuggestion suggestion = (await useCase.ExecuteAsync(CreateProfile(), CancellationToken.None))
            .Suggestions.Single();

        suggestion.Id.ShouldNotBe(aiId);
        suggestion.Id.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task Execute_ReturnsEmptyListWhenAiReturnsNothing()
    {
        StubReview([]);

        ProfileReview result = await useCase.ExecuteAsync(CreateProfile(), CancellationToken.None);

        result.Suggestions.ShouldBeEmpty();
    }

    private void StubReview(IReadOnlyList<ReviewSuggestion> suggestions)
    {
        aiService
            .ReviewProfileAsync(Arg.Any<ResumeProfile>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(suggestions));
    }

    private static ReviewSuggestion CreateSuggestion(
        ReviewSection section,
        Guid? id = null,
        Guid? itemId = null,
        int? bulletIndex = null,
        string title = "Improve this section",
        string detail = "Explain why.",
        string? proposedText = null) => new()
        {
            Id = id ?? Guid.NewGuid(),
            Section = section,
            ItemId = itemId,
            BulletIndex = bulletIndex,
            Category = ReviewCategory.Clarity,
            Title = title,
            Detail = detail,
            OriginalText = null,
            ProposedText = proposedText
        };

    private static ResumeProfile CreateProfile(
        WorkExperience[]? experience = null,
        Project[]? projects = null,
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
            Skills = ["C#"],
            Projects = [.. projects ?? []]
        };
    }

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
        Bullets = [.. bullets]
    };
}
