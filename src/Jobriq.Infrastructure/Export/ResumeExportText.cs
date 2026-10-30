using Jobriq.Domain.Resumes;

namespace Jobriq.Infrastructure.Export;

internal static class ResumeExportText
{
    public static string ProjectMeta(GeneratedProject project)
    {
        string dates = DateRange(project.StartDate, project.EndDate);
        string associated = project.AssociatedWith?.Trim() ?? string.Empty;

        if (dates.Length == 0)
        {
            return associated;
        }

        return associated.Length == 0 ? dates : $"{dates} · {associated}";
    }

    public static string DateRange(string? start, string? end)
    {
        string from = start?.Trim() ?? string.Empty;
        string to = end?.Trim() ?? string.Empty;

        if (from.Length == 0)
        {
            return to;
        }

        return to.Length == 0 ? from : $"{from} – {to}";
    }
}
