using Jobriq.Domain.Resumes;

namespace Jobriq.Infrastructure.Export;

internal static class ProfileTemplateWriter
{
    public static string Write(ResumeProfile profile)
    {
        List<string> sections =
        [
            Personal(profile.Personal),
            Summary(profile)
        ];

        foreach (WorkExperience experience in profile.Experience)
        {
            if (HasContent(experience))
            {
                sections.Add(Experience(experience));
            }
        }

        foreach (Education education in profile.Education)
        {
            if (HasContent(education))
            {
                sections.Add(EducationSection(education));
            }
        }

        sections.Add(Skills(profile.Skills));

        foreach (Project project in profile.Projects)
        {
            if (HasContent(project))
            {
                sections.Add(ProjectSection(project));
            }
        }

        return string.Join("\n\n", sections) + "\n";
    }

    private static string Personal(PersonalInfo personal) => Section(
        "PERSONAL",
        [
            Field("Name", personal.Name),
            Field("Email", personal.Email),
            Field("Phone", personal.Phone),
            Field("Location", personal.Location),
            Field("LinkedIn", personal.LinkedIn),
            Field("GitHub", personal.GitHub),
            Field("Website", personal.Website)
        ]);

    private static string Summary(ResumeProfile profile) => Section(
        "SUMMARY",
        [
            Field(
                "Type",
                profile.SummaryType == SummaryType.Objective ? "objective" : "professional"),
            Field("Content", profile.Summary)
        ]);

    private static string Experience(WorkExperience experience) => Section(
        "EXPERIENCE",
        new[]
        {
            Field("Company", experience.Company),
            Field("Title", experience.Title),
            Field("Start", experience.StartDate),
            Field("End", experience.EndDate)
        }.Concat(BulletLines(experience.Bullets)));

    private static string EducationSection(Education education) => Section(
        "EDUCATION",
        [
            Field("School", education.School),
            Field("Degree", education.Degree),
            Field("Field", education.Field),
            Field("Start", education.StartDate),
            Field("End", education.EndDate),
            Field("GPA", education.Gpa)
        ]);

    private static string Skills(IEnumerable<string> skills)
    {
        string joined = string.Join(
            ", ",
            skills.Select(SingleLine).Where(text => text.Length > 0));

        return Section("SKILLS", joined.Length == 0 ? [] : [joined]);
    }

    private static string ProjectSection(Project project) => Section(
        "PROJECT",
        new[]
        {
            Field("Name", project.Name),
            Field("URL", project.Url),
            Field("Start", project.StartDate),
            Field("End", project.EndDate),
            Field("Associated with", project.AssociatedWith)
        }.Concat(BulletLines(project.Bullets)));

    private static string Section(string name, IEnumerable<string> lines) =>
        string.Join('\n', lines.Prepend($"[{name}]"));

    private static string Field(string key, string? value)
    {
        string text = SingleLine(value);
        return text.Length == 0 ? $"{key}:" : $"{key}: {text}";
    }

    private static IEnumerable<string> BulletLines(IEnumerable<string> bullets) =>
        bullets
            .Select(SingleLine)
            .Where(text => text.Length > 0)
            .Select(text => $"- {text}");

    private static bool HasContent(WorkExperience experience) =>
        HasText(experience.Company) ||
        HasText(experience.Title) ||
        HasText(experience.StartDate) ||
        HasText(experience.EndDate) ||
        experience.Bullets.Any(HasText);

    private static bool HasContent(Education education) =>
        HasText(education.School) ||
        HasText(education.Degree) ||
        HasText(education.Field) ||
        HasText(education.StartDate) ||
        HasText(education.EndDate) ||
        HasText(education.Gpa);

    private static bool HasContent(Project project) =>
        HasText(project.Name) ||
        HasText(project.Url) ||
        HasText(project.StartDate) ||
        HasText(project.EndDate) ||
        HasText(project.AssociatedWith) ||
        project.Bullets.Any(HasText);

    private static bool HasText(string? value) => SingleLine(value).Length > 0;

    private static string SingleLine(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return string.Join(
            ' ',
            value.Split(
                ['\r', '\n'],
                StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    }
}
