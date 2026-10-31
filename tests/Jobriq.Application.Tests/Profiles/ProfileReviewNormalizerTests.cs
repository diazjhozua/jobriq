using Jobriq.Application.Profiles.Review;
using Jobriq.Domain.Reviews;
using Jobriq.Domain.Resumes;
using Shouldly;

namespace Jobriq.Application.Tests.Profiles;

public sealed class ProfileReviewNormalizerTests
{
    [Fact]
    public void KeepsSummaryProposalAndDerivesOriginalText()
    {
        ResumeProfile profile = CreateProfile(summary: "My summary.");

        ProfileReview result = ProfileReviewNormalizer.Normalize(
            [CreateSuggestion(ReviewSection.Summary, proposedText: "Better summary.")],
            profile);

        ReviewSuggestion suggestion = result.Suggestions.Single();
        suggestion.Section.ShouldBe(ReviewSection.Summary);
        suggestion.ItemId.ShouldBeNull();
        suggestion.BulletIndex.ShouldBeNull();
        suggestion.OriginalText.ShouldBe("My summary.");
        suggestion.ProposedText.ShouldBe("Better summary.");
        suggestion.Id.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public void LeavesOriginalTextNullWhenSummaryIsBlank()
    {
        ProfileReview result = ProfileReviewNormalizer.Normalize(
            [CreateSuggestion(ReviewSection.Summary, proposedText: "Better summary.")],
            CreateProfile(summary: "  "));

        result.Suggestions.Single().OriginalText.ShouldBeNull();
    }

    [Fact]
    public void KeepsValidExperienceProposal()
    {
        WorkExperience experience = CreateExperience(["Built a thing"]);
        ResumeProfile profile = CreateProfile(experience: [experience]);

        ProfileReview result = ProfileReviewNormalizer.Normalize(
            [
                CreateSuggestion(
                    ReviewSection.Experience,
                    itemId: experience.Id,
                    bulletIndex: 0,
                    proposedText: "Built a thing\nwith measurable impact.")
            ],
            profile);

        ReviewSuggestion suggestion = result.Suggestions.Single();
        suggestion.ItemId.ShouldBe(experience.Id);
        suggestion.BulletIndex.ShouldBe(0);
        suggestion.OriginalText.ShouldBe("Built a thing");
        suggestion.ProposedText.ShouldBe("Built a thing with measurable impact.");
    }

    [Fact]
    public void KeepsValidProjectProposal()
    {
        Project project = CreateProject(["Shipped a tool"]);
        ResumeProfile profile = CreateProfile(projects: [project]);

        ProfileReview result = ProfileReviewNormalizer.Normalize(
            [
                CreateSuggestion(
                    ReviewSection.Projects,
                    itemId: project.Id,
                    bulletIndex: 0,
                    proposedText: "Shipped a tool to production.")
            ],
            profile);

        ReviewSuggestion suggestion = result.Suggestions.Single();
        suggestion.ItemId.ShouldBe(project.Id);
        suggestion.BulletIndex.ShouldBe(0);
        suggestion.OriginalText.ShouldBe("Shipped a tool");
        suggestion.ProposedText.ShouldBe("Shipped a tool to production.");
    }

    [Fact]
    public void DropsProposalForUnknownItem()
    {
        ResumeProfile profile = CreateProfile(experience: [CreateExperience(["Built a thing"])]);

        ProfileReview result = ProfileReviewNormalizer.Normalize(
            [
                CreateSuggestion(
                    ReviewSection.Experience,
                    itemId: Guid.NewGuid(),
                    bulletIndex: 0,
                    proposedText: "Rewritten.")
            ],
            profile);

        result.Suggestions.ShouldBeEmpty();
    }

    [Fact]
    public void KeepsUnknownItemAsAdvisoryWithoutTargets()
    {
        ResumeProfile profile = CreateProfile(experience: [CreateExperience(["Built a thing"])]);

        ProfileReview result = ProfileReviewNormalizer.Normalize(
            [CreateSuggestion(ReviewSection.Experience, itemId: Guid.NewGuid(), bulletIndex: 0)],
            profile);

        ReviewSuggestion suggestion = result.Suggestions.Single();
        suggestion.ItemId.ShouldBeNull();
        suggestion.BulletIndex.ShouldBeNull();
        suggestion.OriginalText.ShouldBeNull();
        suggestion.ProposedText.ShouldBeNull();
    }

    [Fact]
    public void DropsProposalForOutOfRangeBullet()
    {
        WorkExperience experience = CreateExperience(["Built a thing"]);
        ResumeProfile profile = CreateProfile(experience: [experience]);

        ProfileReview result = ProfileReviewNormalizer.Normalize(
            [
                CreateSuggestion(
                    ReviewSection.Experience,
                    itemId: experience.Id,
                    bulletIndex: 3,
                    proposedText: "Rewritten.")
            ],
            profile);

        result.Suggestions.ShouldBeEmpty();
    }

    [Theory]
    [InlineData(ReviewSection.Personal)]
    [InlineData(ReviewSection.Education)]
    [InlineData(ReviewSection.Certifications)]
    [InlineData(ReviewSection.Awards)]
    [InlineData(ReviewSection.Skills)]
    public void StripsProposedTextFromAdvisorySections(ReviewSection section)
    {
        ProfileReview result = ProfileReviewNormalizer.Normalize(
            [CreateSuggestion(section, proposedText: "Suggested text.")],
            CreateProfile());

        ReviewSuggestion suggestion = result.Suggestions.Single();
        suggestion.Section.ShouldBe(section);
        suggestion.ProposedText.ShouldBeNull();
        suggestion.ItemId.ShouldBeNull();
        suggestion.BulletIndex.ShouldBeNull();
        suggestion.OriginalText.ShouldBeNull();
    }

    [Fact]
    public void DropsSuggestionsWithoutTitle()
    {
        ProfileReview result = ProfileReviewNormalizer.Normalize(
            [CreateSuggestion(ReviewSection.Summary, title: "  ")],
            CreateProfile());

        result.Suggestions.ShouldBeEmpty();
    }

    [Fact]
    public void TurnsBlankProposedTextIntoNull()
    {
        ProfileReview result = ProfileReviewNormalizer.Normalize(
            [CreateSuggestion(ReviewSection.Summary, proposedText: "   ")],
            CreateProfile());

        result.Suggestions.Single().ProposedText.ShouldBeNull();
    }

    [Fact]
    public void CapsSuggestionsAtTwenty()
    {
        IReadOnlyList<ReviewSuggestion> suggestions =
        [
            .. Enumerable.Range(0, 25)
                .Select(index => CreateSuggestion(ReviewSection.Summary, title: $"Suggestion {index}"))
        ];

        ProfileReview result = ProfileReviewNormalizer.Normalize(suggestions, CreateProfile());

        result.Suggestions.Count.ShouldBe(20);
    }

    [Fact]
    public void AssignsFreshIds()
    {
        Guid aiId = Guid.NewGuid();

        ProfileReview result = ProfileReviewNormalizer.Normalize(
            [CreateSuggestion(ReviewSection.Summary, id: aiId)],
            CreateProfile());

        ReviewSuggestion suggestion = result.Suggestions.Single();
        suggestion.Id.ShouldNotBe(aiId);
        suggestion.Id.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public void ReturnsEmptyListWhenAiReturnsNothing()
    {
        ProfileReview result = ProfileReviewNormalizer.Normalize([], CreateProfile());

        result.Suggestions.ShouldBeEmpty();
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
        string summary = "") => new()
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
