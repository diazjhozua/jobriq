using System.Text.RegularExpressions;
using Jobriq.Domain.PiiMasking;
using Jobriq.Domain.Resumes;

namespace Jobriq.Application.PiiMasking;

public static partial class ProfileRedactor
{
    public const string Placeholder = "[redacted]";

    private const int MinScrubLength = 3;
    private const int MinPhoneDigits = 7;

    private static readonly HashSet<string> AmbiguousNameTokens =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "will",
            "may",
            "mark",
            "bill",
            "bob",
            "art",
            "sue",
            "grace",
            "hope",
            "faith",
            "rose",
            "don",
            "gene",
            "ray",
            "dean",
            "chase",
            "hunter",
            "summer",
            "autumn",
            "april",
            "june"
        };

    public static ResumeProfile Redact(ResumeProfile profile, PiiMaskingSettings settings)
    {
        ArgumentNullException.ThrowIfNull(profile);
        ArgumentNullException.ThrowIfNull(settings);

        if (!settings.Enabled)
        {
            return Clone(profile, _ => _, _ => _);
        }

        IReadOnlyList<string> terms = BuildTerms(profile.Personal);
        IReadOnlyList<string> phonePatterns = BuildPhonePatterns(profile.Personal.Phone);

        string Scrub(string value) => ScrubText(value, terms, phonePatterns);
        string? ScrubOptional(string? value) => value is null ? null : Scrub(value);

        return Clone(
            profile,
            Scrub,
            ScrubOptional,
            RedactPersonal(profile.Personal));
    }

    public static string RemovePlaceholders(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        string cleaned = value.Replace(Placeholder, " ", StringComparison.OrdinalIgnoreCase);
        cleaned = Whitespace().Replace(cleaned, " ").Trim();
        return SpaceBeforePunctuation().Replace(cleaned, "$1");
    }

    public static string RemovePlaceholdersPreservingLines(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        List<string> lines = [.. value
            .ReplaceLineEndings("\n")
            .Split('\n')
            .Select(RemovePlaceholders)];

        while (lines.Count > 0 && lines[0].Length == 0)
        {
            lines.RemoveAt(0);
        }

        while (lines.Count > 0 && lines[^1].Length == 0)
        {
            lines.RemoveAt(lines.Count - 1);
        }

        return string.Join('\n', lines);
    }

    private static ResumeProfile Clone(
        ResumeProfile profile,
        Func<string, string> scrub,
        Func<string?, string?> scrubOptional,
        PersonalInfo? personal = null) => new()
    {
        Personal = personal ?? profile.Personal.Clone(),
        SummaryType = profile.SummaryType,
        Summary = scrub(profile.Summary),
        Experience =
        [
            .. profile.Experience.Select(experience => new WorkExperience
            {
                Id = experience.Id,
                Company = scrub(experience.Company),
                Title = scrub(experience.Title),
                StartDate = experience.StartDate,
                EndDate = experience.EndDate,
                Bullets = [.. experience.Bullets.Select(scrub)],
                SkillsGained = experience.SkillsGained is null ? [] : [.. experience.SkillsGained],
                EnhancedBullets = experience.EnhancedBullets is null
                    ? null
                    :
                    [
                        .. experience.EnhancedBullets.Select(bullet => new EnhancedBullet
                        {
                            Original = scrub(bullet.Original),
                            Enhanced = scrub(bullet.Enhanced)
                        })
                    ]
            })
        ],
        Education =
        [
            .. profile.Education.Select(education => new Education
            {
                Id = education.Id,
                School = scrub(education.School),
                Degree = scrub(education.Degree),
                Field = scrub(education.Field),
                StartDate = education.StartDate,
                EndDate = education.EndDate,
                Gpa = scrubOptional(education.Gpa),
                SkillsGained = education.SkillsGained is null ? [] : [.. education.SkillsGained]
            })
        ],
        Certifications =
        [
            .. profile.Certifications.Select(certification => new Certification
            {
                Id = certification.Id,
                Name = scrub(certification.Name),
                IssuingOrganization = scrub(certification.IssuingOrganization),
                IssueDate = certification.IssueDate,
                ExpirationDate = certification.ExpirationDate,
                CredentialId = scrubOptional(certification.CredentialId),
                CredentialUrl = scrubOptional(certification.CredentialUrl),
                SkillsGained = certification.SkillsGained is null ? [] : [.. certification.SkillsGained]
            })
        ],
        Awards =
        [
            .. profile.Awards.Select(award => new Award
            {
                Id = award.Id,
                Title = scrub(award.Title),
                AssociatedWith = scrub(award.AssociatedWith),
                Issuer = scrub(award.Issuer),
                IssueDate = award.IssueDate,
                Description = scrub(award.Description)
            })
        ],
        Skills = [.. profile.Skills.Select(scrub)],
        Projects =
        [
            .. profile.Projects.Select(project => new Project
            {
                Id = project.Id,
                Name = scrub(project.Name),
                Url = scrubOptional(project.Url),
                StartDate = project.StartDate,
                EndDate = project.EndDate,
                AssociatedWith = scrub(project.AssociatedWith),
                Description = scrub(project.Description),
                Bullets = [.. project.Bullets.Select(scrub)],
                SkillsGained = project.SkillsGained is null ? [] : [.. project.SkillsGained],
                EnhancedBullets = project.EnhancedBullets is null
                    ? null
                    :
                    [
                        .. project.EnhancedBullets.Select(bullet => new EnhancedBullet
                        {
                            Original = scrub(bullet.Original),
                            Enhanced = scrub(bullet.Enhanced)
                        })
                    ]
            })
        ]
    };

    private static PersonalInfo RedactPersonal(PersonalInfo personal) => new()
    {
        Name = RedactRequired(personal.Name),
        Email = RedactRequired(personal.Email),
        Phone = RedactRequired(personal.Phone),
        Location = RedactRequired(personal.Location),
        LinkedIn = RedactOptional(personal.LinkedIn),
        GitHub = RedactOptional(personal.GitHub),
        Website = RedactOptional(personal.Website)
    };

    private static string RedactRequired(string value) =>
        string.IsNullOrWhiteSpace(value) ? value : Placeholder;

    private static string? RedactOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? value : Placeholder;

    private static IReadOnlyList<string> BuildTerms(PersonalInfo personal)
    {
        List<string> candidates = [];

        AddNameCandidates(candidates, personal.Name);
        AddEmailCandidates(candidates, personal.Email);
        AddValue(candidates, personal.Phone);

        foreach (string part in personal.Location.Split(
            ',',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            AddValue(candidates, part);
        }

        AddUrlCandidates(candidates, personal.LinkedIn, includeHost: false);
        AddUrlCandidates(candidates, personal.GitHub, includeHost: false);
        AddUrlCandidates(candidates, personal.Website, includeHost: true);

        return
        [
            .. candidates
                .Select(value => value.Trim())
                .Where(value => value.Length >= MinScrubLength)
                .Where(value => !value.Contains(Placeholder, StringComparison.OrdinalIgnoreCase))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderByDescending(value => value.Length)
        ];
    }

    private static void AddNameCandidates(List<string> candidates, string name)
    {
        string trimmed = name.Trim();
        if (trimmed.Length < MinScrubLength
            || trimmed.Contains(Placeholder, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        string[] tokens = trimmed.Split(
            ' ',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (tokens.Length == 1 && AmbiguousNameTokens.Contains(tokens[0]))
        {
            return;
        }

        AddValue(candidates, trimmed);

        if (tokens.Length > 1)
        {
            foreach (string token in tokens)
            {
                if (token.Length >= MinScrubLength && !AmbiguousNameTokens.Contains(token))
                {
                    AddValue(candidates, token);
                }
            }
        }
    }

    private static void AddEmailCandidates(List<string> candidates, string email)
    {
        AddValue(candidates, email);

        int at = email.IndexOf('@', StringComparison.Ordinal);
        if (at > 0)
        {
            AddValue(candidates, email[..at]);
        }
    }

    private static void AddUrlCandidates(List<string> candidates, string? url, bool includeHost)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return;
        }

        string trimmed = url.Trim();
        AddValue(candidates, trimmed);

        if (trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            AddValue(candidates, trimmed["https://".Length..]);
        }
        else if (trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
        {
            AddValue(candidates, trimmed["http://".Length..]);
        }

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out Uri? uri))
        {
            return;
        }

        if (includeHost)
        {
            AddValue(candidates, uri.Host);
        }

        string handle = uri.AbsolutePath
            .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .LastOrDefault() ?? string.Empty;
        AddValue(candidates, handle);
    }

    private static void AddValue(List<string> candidates, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            candidates.Add(value.Trim());
        }
    }

    private static string ScrubText(
        string value,
        IReadOnlyList<string> terms,
        IReadOnlyList<string> phonePatterns)
    {
        if (string.IsNullOrEmpty(value))
        {
            return value;
        }

        string result = value;
        foreach (string term in terms)
        {
            result = Regex.Replace(
                result,
                TermPattern(term),
                Placeholder,
                RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        }

        foreach (string pattern in phonePatterns)
        {
            result = Regex.Replace(result, pattern, Placeholder);
        }

        return result;
    }

    private static string TermPattern(string term)
    {
        string[] parts = Whitespace().Split(term);
        string body = string.Join(@"\s+", parts.Select(Regex.Escape));

        return $@"(?<![\p{{L}}\p{{N}}]){body}(?![\p{{L}}\p{{N}}])";
    }

    private static IReadOnlyList<string> BuildPhonePatterns(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return [];
        }

        string digits = new([.. phone.Where(char.IsDigit)]);
        if (digits.Length < MinPhoneDigits)
        {
            return [];
        }

        List<string> suffixes = [digits[^MinPhoneDigits..]];

        if (digits.Length > 10)
        {
            suffixes.Add(digits[^10..]);
        }

        return
        [
            .. suffixes
                .Distinct(StringComparer.Ordinal)
                .Select(SuffixPattern)
        ];
    }

    private static string SuffixPattern(string digits)
    {
        string body = string.Join(
            @"[\s().+-]{0,2}",
            digits.Select(digit => Regex.Escape(digit.ToString())));

        return $@"(?<!\d){body}(?!\d)";
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();

    [GeneratedRegex(@"\s+([.,!?;:])")]
    private static partial Regex SpaceBeforePunctuation();
}
