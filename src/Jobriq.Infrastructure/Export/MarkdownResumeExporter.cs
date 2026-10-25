using System.Text;
using Jobriq.Application.Abstractions;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Domain.Resumes;

namespace Jobriq.Infrastructure.Export;

public sealed class MarkdownResumeExporter : IResumeExporter
{
    public ExportFormat Format => ExportFormat.Markdown;

    public string ContentType => "text/markdown; charset=utf-8";

    public byte[] Export(GeneratedResume resume)
    {
        List<string> lines = [];

        lines.Add($"# {resume.Personal.Name}");
        lines.Add(string.Empty);

        string contact = string.Join(
            " | ",
            new[] { resume.Personal.Email, resume.Personal.Phone, resume.Personal.Location }
                .Where(value => !string.IsNullOrEmpty(value)));
        lines.Add(contact);

        List<string> links = [];
        AddLink(links, "LinkedIn", resume.Personal.LinkedIn);
        AddLink(links, "GitHub", resume.Personal.GitHub);
        AddLink(links, "Website", resume.Personal.Website);
        if (links.Count > 0)
        {
            lines.Add(string.Join(" | ", links));
        }

        if (!string.IsNullOrEmpty(resume.Summary))
        {
            lines.Add(string.Empty);
            lines.Add("---");
            lines.Add(string.Empty);
            lines.Add("## Professional Summary");
            lines.Add(string.Empty);
            lines.Add(resume.Summary);
        }

        List<GeneratedExperience> activeExperience = [.. resume.Experience.Where(experience =>
            !string.IsNullOrEmpty(experience.Company)
            || !string.IsNullOrEmpty(experience.Title)
            || experience.Bullets.Count > 0)];
        if (activeExperience.Count > 0)
        {
            lines.Add(string.Empty);
            lines.Add("---");
            lines.Add(string.Empty);
            lines.Add("## Work Experience");

            foreach (GeneratedExperience experience in activeExperience)
            {
                lines.Add(string.Empty);
                lines.Add($"### {experience.Title} — {experience.Company}");
                lines.Add($"*{experience.StartDate} – {experience.EndDate}*");
                lines.Add(string.Empty);
                foreach (EnhancedBullet bullet in experience.Bullets)
                {
                    lines.Add($"- {bullet.Enhanced}");
                }
            }
        }

        List<Education> activeEducation = [.. resume.Education.Where(education =>
            !string.IsNullOrEmpty(education.School) || !string.IsNullOrEmpty(education.Degree))];
        if (activeEducation.Count > 0)
        {
            lines.Add(string.Empty);
            lines.Add("---");
            lines.Add(string.Empty);
            lines.Add("## Education");

            foreach (Education education in activeEducation)
            {
                lines.Add(string.Empty);
                lines.Add($"### {education.Degree} in {education.Field} — {education.School}");
                lines.Add($"*{education.StartDate} – {education.EndDate}*");
                if (!string.IsNullOrEmpty(education.Gpa))
                {
                    lines.Add($"GPA: {education.Gpa}");
                }
            }
        }

        if (resume.Skills.Count > 0)
        {
            lines.Add(string.Empty);
            lines.Add("---");
            lines.Add(string.Empty);
            lines.Add("## Skills");
            lines.Add(string.Empty);
            lines.Add(string.Join(", ", resume.Skills));
        }

        List<GeneratedProject> activeProjects = [.. resume.Projects.Where(project =>
            !string.IsNullOrEmpty(project.Name) && project.Bullets.Count > 0)];
        if (activeProjects.Count > 0)
        {
            lines.Add(string.Empty);
            lines.Add("---");
            lines.Add(string.Empty);
            lines.Add("## Projects");

            foreach (GeneratedProject project in activeProjects)
            {
                lines.Add(string.Empty);
                lines.Add(string.IsNullOrEmpty(project.Url)
                    ? $"### {project.Name}"
                    : $"### [{project.Name}]({project.Url})");
                foreach (EnhancedBullet bullet in project.Bullets)
                {
                    lines.Add($"- {bullet.Enhanced}");
                }
            }
        }

        lines.Add(string.Empty);

        return new UTF8Encoding(encoderShouldEmitUTF8Identifier: false).GetBytes(string.Join('\n', lines));
    }

    private static void AddLink(List<string> links, string label, string? url)
    {
        if (!string.IsNullOrEmpty(url))
        {
            links.Add($"[{label}]({url})");
        }
    }
}
