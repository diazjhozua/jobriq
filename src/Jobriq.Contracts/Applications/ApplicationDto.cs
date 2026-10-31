namespace Jobriq.Contracts;

public sealed class ApplicationDto
{
    public Guid Id { get; set; }

    public string Company { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string JobDescription { get; set; } = string.Empty;

    public ApplicationStatusDto Status { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateOnly? AppliedDate { get; set; }

    public GeneratedResumeDto? GeneratedResume { get; set; }

    public CoverLetterDto? CoverLetter { get; set; }
}
