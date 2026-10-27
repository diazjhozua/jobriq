using Jobriq.Domain.Reviews;

namespace Jobriq.Infrastructure.Ai;

internal sealed class ReviewSuggestionDto
{
    public string? Section { get; set; }

    public string? ItemId { get; set; }

    public int? BulletIndex { get; set; }

    public string? Category { get; set; }

    public string? Title { get; set; }

    public string? Detail { get; set; }

    public string? ProposedText { get; set; }
}

internal static class ReviewSuggestionMapper
{
    public static IReadOnlyList<ReviewSuggestion> Map(IEnumerable<ReviewSuggestionDto?>? suggestions)
    {
        if (suggestions is null)
        {
            return [];
        }

        List<ReviewSuggestion> mapped = [];
        foreach (ReviewSuggestionDto? suggestion in suggestions)
        {
            if (suggestion is null ||
                !TryParseSection(suggestion.Section, out ReviewSection section))
            {
                continue;
            }

            string title = suggestion.Title?.Trim() ?? string.Empty;
            if (title.Length == 0)
            {
                continue;
            }

            mapped.Add(new ReviewSuggestion
            {
                Id = Guid.NewGuid(),
                Section = section,
                ItemId = Guid.TryParse(suggestion.ItemId, out Guid itemId) ? itemId : null,
                BulletIndex = suggestion.BulletIndex is >= 0 ? suggestion.BulletIndex : null,
                Category = ParseCategory(suggestion.Category),
                Title = title,
                Detail = suggestion.Detail?.Trim() ?? string.Empty,
                OriginalText = null,
                ProposedText = TrimToNull(suggestion.ProposedText)
            });
        }

        return mapped;
    }

    private static bool TryParseSection(string? value, out ReviewSection section) =>
        Enum.TryParse(value, ignoreCase: true, out section) && Enum.IsDefined(section);

    private static ReviewCategory ParseCategory(string? value) =>
        Enum.TryParse(value, ignoreCase: true, out ReviewCategory category) && Enum.IsDefined(category)
            ? category
            : ReviewCategory.Clarity;

    private static string? TrimToNull(string? value)
    {
        string? trimmed = value?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }
}
