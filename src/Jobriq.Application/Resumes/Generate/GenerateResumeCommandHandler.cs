using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.Resumes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Resumes.Generate;

internal sealed class GenerateResumeCommandHandler(
    IResumeAiService aiService,
    TimeProvider timeProvider)
    : ICommandHandler<GenerateResumeCommand, GeneratedResumeDto>
{
    public async Task<Result<GeneratedResumeDto>> Handle(
        GenerateResumeCommand command,
        CancellationToken cancellationToken)
    {
        ResumeProfile profile = ProfileMappings.ToDomain(command.Profile!);

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
        if (!string.IsNullOrWhiteSpace(command.JobDescription))
        {
            ResumeProfile profileWithEnhancements = new()
            {
                Personal = profile.Personal,
                SummaryType = profile.SummaryType,
                Summary = summary,
                Experience = experiences,
                Education = profile.Education,
                Certifications = profile.Certifications,
                Awards = profile.Awards,
                Skills = profile.Skills,
                Projects = projects
            };

            keywords = await aiService.ExtractKeywordsAsync(
                command.JobDescription,
                profileWithEnhancements,
                cancellationToken);
        }

        GeneratedResume resume = new()
        {
            Personal = profile.Personal.Clone(),
            Summary = summary,
            Experience = [.. experiences.Select(ToGenerated)],
            Education = [.. profile.Education.Select(Clone)],
            Certifications = [.. profile.Certifications.Select(Clone)],
            Awards = [.. profile.Awards.Select(Clone)],
            Skills = [.. profile.Skills],
            Projects = [.. projects.Select(ToGenerated)],
            Keywords = keywords,
            GeneratedAt = timeProvider.GetUtcNow()
        };

        return ResumeMappings.ToDto(resume);
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
        StartDate = project.StartDate,
        EndDate = project.EndDate,
        AssociatedWith = project.AssociatedWith,
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

    private static Certification Clone(Certification certification) => new()
    {
        Id = certification.Id,
        Name = certification.Name,
        IssuingOrganization = certification.IssuingOrganization,
        IssueDate = certification.IssueDate,
        ExpirationDate = certification.ExpirationDate,
        CredentialId = certification.CredentialId,
        CredentialUrl = certification.CredentialUrl
    };

    private static Award Clone(Award award) => new()
    {
        Id = award.Id,
        Title = award.Title,
        AssociatedWith = award.AssociatedWith,
        Issuer = award.Issuer,
        IssueDate = award.IssueDate,
        Description = award.Description
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
        StartDate = project.StartDate,
        EndDate = project.EndDate,
        AssociatedWith = project.AssociatedWith,
        Bullets = project.EnhancedBullets ?? []
    };
}
