using Jobriq.Application.Abstractions;
using Jobriq.Domain.Resumes;

namespace Jobriq.Application.Resumes.GenerateResume;

public sealed class GenerateResumeUseCase(IResumeAiService aiService, TimeProvider timeProvider)
{
    public async Task<GeneratedResume> ExecuteAsync(
        ResumeProfile profile,
        string? jobDescription,
        CancellationToken cancellationToken)
    {
        aiService.EnsureAvailable();

        List<WorkExperience> experiences = [];
        foreach (WorkExperience experience in profile.Experience)
        {
            WorkExperience copy = Clone(experience);
            if (copy.Bullets.Count > 0)
            {
                copy.EnhancedBullets = [.. await aiService.EnhanceExperienceBulletsAsync(copy, cancellationToken)];
            }

            experiences.Add(copy);
        }

        List<Project> projects = [];
        foreach (Project project in profile.Projects)
        {
            Project copy = Clone(project);
            if (copy.Bullets.Count > 0)
            {
                copy.EnhancedBullets = [.. await aiService.EnhanceProjectBulletsAsync(copy, cancellationToken)];
            }

            projects.Add(copy);
        }

        string summary = profile.Summary;
        if (string.IsNullOrWhiteSpace(summary) && experiences.Count > 0)
        {
            summary = await aiService.GenerateSummaryAsync(experiences, profile.SummaryType, cancellationToken);
        }

        KeywordMatch? keywords = null;
        if (!string.IsNullOrWhiteSpace(jobDescription))
        {
            ResumeProfile profileWithEnhancements = new()
            {
                Personal = profile.Personal,
                SummaryType = profile.SummaryType,
                Summary = summary,
                Experience = experiences,
                Education = profile.Education,
                Skills = profile.Skills,
                Projects = projects
            };

            keywords = await aiService.ExtractKeywordsAsync(jobDescription, profileWithEnhancements, cancellationToken);
        }

        return new GeneratedResume
        {
            Personal = Clone(profile.Personal),
            Summary = summary,
            Experience = [.. experiences.Select(ToGenerated)],
            Education = [.. profile.Education.Select(Clone)],
            Skills = [.. profile.Skills],
            Projects = [.. projects.Select(ToGenerated)],
            Keywords = keywords,
            GeneratedAt = timeProvider.GetUtcNow()
        };
    }

    private static WorkExperience Clone(WorkExperience experience) => new()
    {
        Id = experience.Id,
        Company = experience.Company,
        Title = experience.Title,
        StartDate = experience.StartDate,
        EndDate = experience.EndDate,
        Bullets = [.. experience.Bullets]
    };

    private static Project Clone(Project project) => new()
    {
        Id = project.Id,
        Name = project.Name,
        Url = project.Url,
        Bullets = [.. project.Bullets]
    };

    private static Education Clone(Education education) => new()
    {
        Id = education.Id,
        School = education.School,
        Degree = education.Degree,
        Field = education.Field,
        StartDate = education.StartDate,
        EndDate = education.EndDate,
        Gpa = education.Gpa
    };

    private static PersonalInfo Clone(PersonalInfo personal) => new()
    {
        Name = personal.Name,
        Email = personal.Email,
        Phone = personal.Phone,
        Location = personal.Location,
        LinkedIn = personal.LinkedIn,
        GitHub = personal.GitHub,
        Website = personal.Website
    };

    private static GeneratedExperience ToGenerated(WorkExperience experience) => new()
    {
        Id = experience.Id,
        Company = experience.Company,
        Title = experience.Title,
        StartDate = experience.StartDate,
        EndDate = experience.EndDate,
        Bullets = experience.EnhancedBullets ?? []
    };

    private static GeneratedProject ToGenerated(Project project) => new()
    {
        Id = project.Id,
        Name = project.Name,
        Url = project.Url,
        Bullets = project.EnhancedBullets ?? []
    };
}
