namespace Jobriq.Domain.Reviews;

public sealed class ReviewSuggestion
{
    public Guid Id { get; set; }

    public ReviewSection Section { get; set; }

    public Guid? ItemId { get; set; }

    public int? BulletIndex { get; set; }

    public ReviewCategory Category { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Detail { get; set; } = string.Empty;

    public string? OriginalText { get; set; }

    public string? ProposedText { get; set; }
}
