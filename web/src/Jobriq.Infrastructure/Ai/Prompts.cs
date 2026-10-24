using Jobriq.Domain.Resumes;

namespace Jobriq.Infrastructure.Ai;

internal static class Prompts
{
    public const string System = """
        You are an expert resume writer with 20 years of experience helping professionals land their dream jobs at top companies like Google, Amazon, and Microsoft.

        Your principles:
        - Bullets describe accomplishments, not tasks
        - Every bullet answers "so what?" — what was the impact on the user, team, or company?
        - Use strong action verbs (Built, Led, Reduced, Increased, Delivered, Automated...)
        - Add quantification where possible; use [X units] as a placeholder when the user must supply the number, and set needsQuantification to true
        - Keep language concise, specific, and professional
        - Never fabricate facts — only enhance what the user has already written
        """;

    public static string EnhanceExperience(WorkExperience experience) =>
        Normalize($$"""
            Enhance the following resume bullet points for the role of "{{experience.Title}}" at "{{experience.Company}}".

            For each bullet:
            1. Rewrite it as an accomplishment (not a task description)
            2. Add results or outcomes — answer "so what?"
            3. Use a strong action verb at the start
            4. If a specific number would strengthen the bullet but you cannot determine it, insert [X unit] as a placeholder and set needsQuantification to true
            5. If the bullet already has a number or the impact is inherently clear, set needsQuantification to false

            Bullets:
            {{BulletList(experience.Bullets)}}

            Respond with a JSON object:
            {
              "bullets": [
                {
                  "original": "exact original text",
                  "enhanced": "rewritten bullet",
                  "needsQuantification": true or false
                }
              ]
            }
            """);

    public static string EnhanceProject(Project project) =>
        Normalize($$"""
            Enhance the following resume bullet points for a project called "{{project.Name}}".

            For each bullet:
            1. Rewrite it as an accomplishment (not a task description)
            2. Add results or outcomes — answer "so what?"
            3. Use a strong action verb at the start
            4. If a specific number would strengthen the bullet but you cannot determine it, insert [X unit] as a placeholder and set needsQuantification to true
            5. If the bullet already has a number or the impact is inherently clear, set needsQuantification to false

            Bullets:
            {{BulletList(project.Bullets)}}

            Respond with a JSON object:
            {
              "bullets": [
                {
                  "original": "exact original text",
                  "enhanced": "rewritten bullet",
                  "needsQuantification": true or false
                }
              ]
            }
            """);

    public static string GenerateSummary(IReadOnlyList<WorkExperience> experience, SummaryType summaryType)
    {
        string experienceText = string.Join(
            "\n\n",
            experience.Select(job =>
            {
                IEnumerable<string> bullets = job.EnhancedBullets is not null
                    ? job.EnhancedBullets.Select(bullet => $"- {bullet.Enhanced}")
                    : job.Bullets.Select(bullet => $"- {bullet}");

                return $"{job.Title} at {job.Company} ({job.StartDate} – {job.EndDate})\n{string.Join('\n', bullets)}";
            }));

        string typeDescription = summaryType == SummaryType.Objective
            ? "objective statement for someone with less than 2 years of experience — highlights education, skills, and career goals"
            : "professional summary for someone with 2+ years of experience — highlights expertise, key achievements, and value delivered";

        return Normalize($$"""
            Write a {{typeDescription}} based on the work experience below.

            Requirements:
            - Maximum 3 lines
            - Concise and impactful — no filler phrases
            - Written without using "I"
            - Highlight the most impressive aspects of the candidate's background

            Work Experience:
            {{experienceText}}

            Respond with only the summary text — no quotes, no labels, no extra explanation.
            """);
    }

    public static string ExtractKeywords(string jobDescription, ResumeProfile profile)
    {
        IEnumerable<string> lines = new[]
            {
                string.Join(", ", profile.Skills)
            }
            .Concat(profile.Experience.SelectMany(job => new[]
            {
                $"{job.Title} at {job.Company}"
            }.Concat(job.EnhancedBullets is not null
                ? job.EnhancedBullets.Select(bullet => bullet.Enhanced)
                : job.Bullets)))
            .Concat(profile.Projects.SelectMany(project => project.Bullets))
            .Where(line => !string.IsNullOrEmpty(line));

        string resumeText = string.Join('\n', lines);

        return Normalize($$"""
            Extract the top 20 most important keywords from this job description (skills, technologies, tools, methodologies, certifications).

            Then check which of those keywords genuinely appear in the resume text below. Be strict — only mark a keyword as matched if it clearly appears in the resume.

            Job Description:
            {{jobDescription}}

            Resume Text:
            {{resumeText}}

            Respond with a JSON object:
            {
              "matched": ["keyword1", "keyword2"],
              "missing": ["keyword3", "keyword4"]
            }

            Rules:
            - Total keywords (matched + missing) must be exactly 20
            - Only include a keyword in "matched" if it clearly appears in the resume text
            - Keywords should be specific terms, not generic phrases
            """);
    }

    private static string BulletList(IReadOnlyList<string> bullets) =>
        string.Join('\n', bullets.Select((bullet, index) => $"{index + 1}. {bullet}"));

    private static string Normalize(string value) => value.ReplaceLineEndings("\n");
}
