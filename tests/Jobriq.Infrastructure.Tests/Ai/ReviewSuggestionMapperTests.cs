using Jobriq.Domain.Reviews;
using Jobriq.Infrastructure.Ai;
using Shouldly;

namespace Jobriq.Infrastructure.Tests.Ai;

public sealed class ReviewSuggestionMapperTests
{
    [Fact]
    public void Map_ReturnsEmptyForNull()
    {
        ReviewSuggestionMapper.Map(null).ShouldBeEmpty();
    }

    [Fact]
    public void Map_SkipsNullEntries()
    {
        IReadOnlyList<ReviewSuggestion> result = ReviewSuggestionMapper.Map(
        [
            null,
            new ReviewSuggestionDto
            {
                Section = "summary",
                Title = "Improve summary"
            }
        ]);

        result.Single().Title.ShouldBe("Improve summary");
    }

    [Fact]
    public void Map_DropsUnknownSection()
    {
        IReadOnlyList<ReviewSuggestion> result = ReviewSuggestionMapper.Map(
        [
            new ReviewSuggestionDto
            {
                Section = "hobbies",
                Title = "Add hobbies"
            }
        ]);

        result.ShouldBeEmpty();
    }

    [Fact]
    public void Map_MapsKnownValues()
    {
        Guid itemId = Guid.NewGuid();

        ReviewSuggestion suggestion = ReviewSuggestionMapper.Map(
        [
            new ReviewSuggestionDto
            {
                Section = "experience",
                ItemId = itemId.ToString(),
                BulletIndex = 2,
                Category = "impact",
                Title = "  Quantify impact  ",
                Detail = "  Add a number.  ",
                ProposedText = "  Rewritten bullet.  "
            }
        ]).Single();

        suggestion.Section.ShouldBe(ReviewSection.Experience);
        suggestion.ItemId.ShouldBe(itemId);
        suggestion.BulletIndex.ShouldBe(2);
        suggestion.Category.ShouldBe(ReviewCategory.Impact);
        suggestion.Title.ShouldBe("Quantify impact");
        suggestion.Detail.ShouldBe("Add a number.");
        suggestion.ProposedText.ShouldBe("Rewritten bullet.");
        suggestion.Id.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public void Map_TurnsInvalidItemIdIntoNull()
    {
        ReviewSuggestion suggestion = ReviewSuggestionMapper.Map(
        [
            new ReviewSuggestionDto
            {
                Section = "projects",
                ItemId = "not-a-guid",
                Title = "Improve project"
            }
        ]).Single();

        suggestion.ItemId.ShouldBeNull();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("unknown")]
    public void Map_FallsBackToClarityForUnknownCategory(string? category)
    {
        ReviewSuggestion suggestion = ReviewSuggestionMapper.Map(
        [
            new ReviewSuggestionDto
            {
                Section = "summary",
                Category = category,
                Title = "Improve summary"
            }
        ]).Single();

        suggestion.Category.ShouldBe(ReviewCategory.Clarity);
    }

    [Fact]
    public void Map_TurnsNegativeBulletIndexIntoNull()
    {
        ReviewSuggestion suggestion = ReviewSuggestionMapper.Map(
        [
            new ReviewSuggestionDto
            {
                Section = "experience",
                BulletIndex = -1,
                Title = "Improve bullet"
            }
        ]).Single();

        suggestion.BulletIndex.ShouldBeNull();
    }

    [Fact]
    public void Map_TurnsBlankProposedTextIntoNull()
    {
        ReviewSuggestion suggestion = ReviewSuggestionMapper.Map(
        [
            new ReviewSuggestionDto
            {
                Section = "skills",
                Title = "Group skills",
                ProposedText = "   "
            }
        ]).Single();

        suggestion.ProposedText.ShouldBeNull();
    }

    [Fact]
    public void Map_DropsSuggestionsWithoutTitle()
    {
        ReviewSuggestionMapper.Map(
        [
            new ReviewSuggestionDto
            {
                Section = "summary",
                Title = "   "
            }
        ]).ShouldBeEmpty();
    }
}
