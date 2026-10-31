using System.Text.RegularExpressions;
using Jobriq.Application.Abstractions;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;

namespace Jobriq.Application.CoverLetters.Generate;

public static partial class CoverLetterNormalizer
{
    private const int MinParagraphs = 3;
    private const int MaxParagraphs = 6;
    private const int MinWords = 150;
    private const int MaxWords = 450;

    private static readonly string[] AcceptedClosings = ["Sincerely,", "Best regards,", "Thank you,"];

    public static void EnsureCanGenerate(ResumeProfile profile)
    {
        ArgumentNullException.ThrowIfNull(profile);

        if (profile.Personal is null || string.IsNullOrWhiteSpace(profile.Personal.Name))
        {
            throw new JobriqValidationException("Add your name to the profile before generating a cover letter.");
        }
    }

    public static CoverLetter Normalize(
        CoverLetterDraft draft,
        ResumeProfile profile,
        string company,
        string role,
        DateTimeOffset generatedAt)
    {
        ArgumentNullException.ThrowIfNull(draft);
        EnsureCanGenerate(profile);

        string name = profile.Personal.Name.Trim();

        List<string> paragraphs =
        [
            .. (draft.Paragraphs ?? [])
                .Where(paragraph => !string.IsNullOrWhiteSpace(paragraph))
                .Select(Clean)
                .Where(text => text.Length > 0)
        ];

        if (paragraphs.Count < MinParagraphs || paragraphs.Count > MaxParagraphs)
        {
            throw InvalidResponse("The cover letter did not have a usable structure. Regenerate it.");
        }

        int wordCount = paragraphs.Sum(CountWords);
        if (wordCount < MinWords || wordCount > MaxWords)
        {
            throw InvalidResponse("The cover letter was the wrong length. Regenerate it.");
        }

        string combined = string.Join('\n', paragraphs);
        string scanned = RemoveNames(combined, company, role);
        if (BannedPhrase().IsMatch(scanned))
        {
            throw InvalidResponse("The cover letter read like a template. Regenerate it.");
        }

        return new CoverLetter
        {
            Personal = profile.Personal.Clone(),
            Company = company.Trim(),
            Role = role.Trim(),
            Salutation = BuildSalutation(company),
            Paragraphs = paragraphs,
            Closing = NormalizeClosing(draft.Closing),
            Signature = name,
            GeneratedAt = generatedAt
        };
    }

    private static string RemoveNames(string text, string company, string role)
    {
        foreach (string name in new[] { company.Trim(), role.Trim() })
        {
            if (name.Length > 0)
            {
                text = text.Replace(name, string.Empty, StringComparison.OrdinalIgnoreCase);
            }
        }

        return text;
    }

    private static string BuildSalutation(string company)
    {
        string name = company.Trim().TrimEnd('.', ',', '!');
        return name.Length == 0 ? "Dear Hiring Manager," : $"Dear {name} Hiring Team,";
    }

    private static string NormalizeClosing(string? closing)
    {
        string value = (closing ?? string.Empty).Trim();
        return AcceptedClosings.FirstOrDefault(
            accepted => string.Equals(accepted, value, StringComparison.OrdinalIgnoreCase))
            ?? "Sincerely,";
    }

    private static string Clean(string paragraph)
    {
        string value = paragraph.ReplaceLineEndings(" ").Trim();
        value = value.Trim('"', '\'', '“', '”');
        value = MarkdownMarkers().Replace(value, string.Empty);
        value = ListMarker().Replace(value, string.Empty);
        value = HeadingMarker().Replace(value, string.Empty);

        return Whitespace().Replace(value, " ").Trim();
    }

    private static int CountWords(string paragraph) =>
        paragraph.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;

    private static AiServiceException InvalidResponse(string message) =>
        new("openai_invalid_response", message, 502);

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();

    [GeneratedRegex(@"\*\*|__|\*")]
    private static partial Regex MarkdownMarkers();

    [GeneratedRegex(@"^\s*[-•]\s+")]
    private static partial Regex ListMarker();

    [GeneratedRegex(@"^\s*#+\s*")]
    private static partial Regex HeadingMarker();

    [GeneratedRegex(
        @"\b(?:i am writing to apply|i am writing to express my interest|to whom it may concern|i am confident that|esteemed organization|i would be a great fit|proven track record|leverage my|passionate about)\b",
        RegexOptions.IgnoreCase)]
    private static partial Regex BannedPhrase();
}
