using System.Text.RegularExpressions;

namespace Jobriq.Application.Resumes.ExportResume;

public static partial class ResumeFileName
{
    public static string Create(string name, DateTimeOffset localTime, string document = "resume")
    {
        string slug = Whitespace().Replace(name.ToLowerInvariant().Trim(), "-");
        slug = InvalidCharacters().Replace(slug, string.Empty);
        string baseName = slug.Length > 0 ? $"{slug}-{document}" : document;
        return $"{baseName}-{localTime:yyyyMMdd-HHmmss}";
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();

    [GeneratedRegex(@"[^a-z0-9-]")]
    private static partial Regex InvalidCharacters();
}
