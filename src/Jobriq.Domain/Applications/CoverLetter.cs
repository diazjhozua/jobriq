using Jobriq.Domain.Resumes;

namespace Jobriq.Domain.Applications;

public sealed class CoverLetter
{
    public PersonalInfo Personal { get; set; } = new();

    public string Company { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string Salutation { get; set; } = string.Empty;

    public List<string> Paragraphs { get; set; } = [];

    public string Closing { get; set; } = string.Empty;

    public string Signature { get; set; } = string.Empty;

    public DateTimeOffset GeneratedAt { get; set; }
}
