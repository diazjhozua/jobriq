using Jobriq.Contracts;
using Jobriq.Domain.Reviews;

namespace Jobriq.Application.Common.Mapping;

public static class ReviewMappings
{
    public static ReviewProfileResponse ToResponse(ProfileReview review)
    {
        ArgumentNullException.ThrowIfNull(review);

        return new ReviewProfileResponse
        {
            Suggestions = review.Suggestions is null
                ? []
                : review.Suggestions.Select(ToDto).ToList()
        };
    }

    public static ReviewSuggestionDto ToDto(ReviewSuggestion suggestion) => new()
    {
        Id = suggestion.Id,
        Section = EnumMappings.Map<ReviewSection, ReviewSectionDto>(suggestion.Section),
        ItemId = suggestion.ItemId,
        BulletIndex = suggestion.BulletIndex,
        Category = EnumMappings.Map<ReviewCategory, ReviewCategoryDto>(suggestion.Category),
        Title = suggestion.Title,
        Detail = suggestion.Detail,
        OriginalText = suggestion.OriginalText,
        ProposedText = suggestion.ProposedText
    };
}
