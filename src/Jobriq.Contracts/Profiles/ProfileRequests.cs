namespace Jobriq.Contracts;

public sealed class SaveProfileRequest
{
    public ProfileDto? Profile { get; set; }
}

public sealed class SaveProfileResponse
{
    public ProfileDto Profile { get; set; } = new();
}

public sealed class ReviewProfileRequest
{
    public ProfileDto? Profile { get; set; }
}

public sealed class ReviewProfileResponse
{
    public List<ReviewSuggestionDto> Suggestions { get; set; } = [];
}

public sealed class ReviewSuggestionDto
{
    public Guid Id { get; set; }

    public ReviewSectionDto Section { get; set; }

    public Guid? ItemId { get; set; }

    public int? BulletIndex { get; set; }

    public ReviewCategoryDto Category { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Detail { get; set; } = string.Empty;

    public string? OriginalText { get; set; }

    public string? ProposedText { get; set; }
}

public sealed class GenerateStandaloneResumeRequest
{
    public ProfileDto? Profile { get; set; }

    public string? JobDescription { get; set; }
}
