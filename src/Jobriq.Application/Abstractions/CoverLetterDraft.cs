namespace Jobriq.Application.Abstractions;

public sealed class CoverLetterDraft
{
    public List<string>? Paragraphs { get; set; }

    public string? Closing { get; set; }
}
