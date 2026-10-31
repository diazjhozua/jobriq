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

    public static string CertificationHeader(Certification certification)
    {
        string name = certification.Name?.Trim() ?? string.Empty;
        string organization = certification.IssuingOrganization?.Trim() ?? string.Empty;

        if (name.Length == 0)
        {
            return organization;
        }

        return organization.Length == 0 ? name : $"{name} — {organization}";
    }

    public static string CertificationMeta(Certification certification)
    {
        string credentialId = certification.CredentialId?.Trim() ?? string.Empty;

        return JoinParts(
            DateRange(certification.IssueDate, certification.ExpirationDate),
            credentialId.Length == 0 ? string.Empty : $"Credential ID: {credentialId}",
            certification.CredentialUrl?.Trim() ?? string.Empty);
    }

    public static string AwardHeader(Award award)
    {
        string title = award.Title?.Trim() ?? string.Empty;
        string issuer = award.Issuer?.Trim() ?? string.Empty;

        if (title.Length == 0)
        {
            return issuer;
        }

        return issuer.Length == 0 ? title : $"{title} — {issuer}";
    }

    public static string AwardMeta(Award award) =>
        JoinParts(
            award.IssueDate?.Trim() ?? string.Empty,
            award.AssociatedWith?.Trim() ?? string.Empty);

    public static bool HasContent(Certification certification) =>
        CertificationHeader(certification).Length > 0;

    public static bool HasContent(Award award) => AwardHeader(award).Length > 0;

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

    private static string JoinParts(params string[] parts) =>
        string.Join(" · ", parts.Where(part => part.Length > 0));
}
