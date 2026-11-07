using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.PiiMasking;
using Jobriq.Application.Abstractions.PromptStyles;
using Jobriq.Application.Common.Mapping;
using Jobriq.Application.PiiMasking;
using Jobriq.Contracts;
using Jobriq.Domain.PiiMasking;
using Jobriq.Domain.PromptStyles;
using Jobriq.Domain.Resumes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Resumes.Generate;

internal sealed class GenerateResumeCommandHandler(
    IResumeAiService aiService,
    IPromptStyleResolver promptStyleResolver,
    IPiiMaskingSettingsResolver piiMaskingSettingsResolver,
    TimeProvider timeProvider)
    : ICommandHandler<GenerateResumeCommand, GeneratedResumeDto>
{
    public async Task<Result<GeneratedResumeDto>> Handle(
        GenerateResumeCommand command,
        CancellationToken cancellationToken)
    {
        ResumeProfile profile = ProfileMappings.ToDomain(command.Profile!);

        aiService.EnsureAvailable();

        PromptStyleDefinition style = await promptStyleResolver.ResolveAsync(cancellationToken);

        PiiMaskingSettings masking = await piiMaskingSettingsResolver.ResolveAsync(
            cancellationToken);

        ResumeProfile aiProfile = ProfileRedactor.Redact(profile, masking);

        List<WorkExperience> experiences = [];
        List<WorkExperience> aiExperiences = [];
        for (int index = 0; index < profile.Experience.Count; index++)
        {
            WorkExperience aiCopy = Clone(aiProfile.Experience[index]);
            WorkExperience copy = Clone(profile.Experience[index]);

            if (aiCopy.Bullets.Count > 0)
            {
                IReadOnlyList<EnhancedBullet> enhanced =
                    await aiService.EnhanceExperienceBulletsAsync(
                        aiCopy,
                        style,
                        cancellationToken);

                aiCopy.EnhancedBullets = CleanEnhanced(
                    enhanced,
                    aiCopy.Bullets,
                    aiCopy.Bullets);
                copy.EnhancedBullets = CleanEnhanced(
                    enhanced,
                    aiCopy.Bullets,
                    copy.Bullets);
            }

            aiExperiences.Add(aiCopy);
            experiences.Add(copy);
        }

        List<Project> projects = [];
        List<Project> aiProjects = [];
        for (int index = 0; index < profile.Projects.Count; index++)
        {
            Project aiCopy = Clone(aiProfile.Projects[index]);
            Project copy = Clone(profile.Projects[index]);

            if (aiCopy.Bullets.Count > 0 || !string.IsNullOrWhiteSpace(aiCopy.Description))
            {
                EnhancedProject enhanced =
                    await aiService.EnhanceProjectAsync(
                        aiCopy,
                        style,
                        cancellationToken);

                if (aiCopy.Bullets.Count > 0)
                {
                    aiCopy.EnhancedBullets = CleanEnhanced(
                        enhanced.Bullets,
                        aiCopy.Bullets,
                        aiCopy.Bullets);
                    copy.EnhancedBullets = CleanEnhanced(
                        enhanced.Bullets,
                        aiCopy.Bullets,
                        copy.Bullets);
                }
                else
                {
                    aiCopy.EnhancedBullets = [];
                    copy.EnhancedBullets = [];
                }

                copy.Description = CleanDescription(enhanced.Description, copy.Description);
            }

            aiProjects.Add(aiCopy);
            projects.Add(copy);
        }

        string summary = profile.Summary;
        string aiSummary = aiProfile.Summary;
        if (string.IsNullOrWhiteSpace(summary) && aiExperiences.Count > 0)
        {
            aiSummary = ProfileRedactor.RemovePlaceholders(
                await aiService.GenerateSummaryAsync(
                    aiExperiences,
                    aiProfile.SummaryType,
                    style,
                    cancellationToken));
            summary = aiSummary;
        }

        KeywordMatch? keywords = null;
        if (!string.IsNullOrWhiteSpace(command.JobDescription))
        {
            ResumeProfile profileWithEnhancements = new()
            {
                Personal = aiProfile.Personal,
                SummaryType = aiProfile.SummaryType,
                Summary = aiSummary,
                Experience = aiExperiences,
                Education = aiProfile.Education,
                Certifications = aiProfile.Certifications,
                Awards = aiProfile.Awards,
                Skills = aiProfile.Skills,
                Projects = aiProjects
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
            Experience =
            [
                .. experiences.Select((experience, index) =>
                    ToGenerated(profile.Experience[index], experience))
            ],
            Education = [.. profile.Education.Select(Clone)],
            Certifications = [.. profile.Certifications.Select(Clone)],
            Awards = [.. profile.Awards.Select(Clone)],
            Skills = [.. profile.Skills],
            Projects =
            [
                .. projects.Select((project, index) =>
                    ToGenerated(profile.Projects[index], project))
            ],
            Keywords = keywords,
            GeneratedAt = timeProvider.GetUtcNow()
        };

        return ResumeMappings.ToDto(resume);
    }

    private static List<EnhancedBullet> CleanEnhanced(
        IReadOnlyList<EnhancedBullet> bullets,
        IReadOnlyList<string> redactedOriginals,
        IReadOnlyList<string> realOriginals)
    {
        List<EnhancedBullet> cleaned = [];

        foreach (EnhancedBullet bullet in bullets)
        {
            int index = FindOriginalIndex(redactedOriginals, bullet.Original);

            string original = index >= 0 && index < realOriginals.Count
                ? realOriginals[index]
                : ProfileRedactor.RemovePlaceholders(bullet.Original);

            string enhanced = ProfileRedactor.RemovePlaceholders(bullet.Enhanced);
            if (enhanced.Length == 0)
            {
                enhanced = original;
            }

            cleaned.Add(new EnhancedBullet
            {
                Original = original,
                Enhanced = enhanced
            });
        }

        return cleaned;
    }

    private static string CleanDescription(string? enhanced, string realOriginal)
    {
        if (string.IsNullOrWhiteSpace(realOriginal))
        {
            return string.Empty;
        }

        string cleaned = ProfileRedactor.RemovePlaceholdersPreservingLines(enhanced);
        return cleaned.Length == 0 ? realOriginal.Trim() : cleaned;
    }

    private static int FindOriginalIndex(
        IReadOnlyList<string> originals,
        string? original)
    {
        string normalized = original?.Trim() ?? string.Empty;

        for (int index = 0; index < originals.Count; index++)
        {
            if (string.Equals(
                originals[index].Trim(),
                normalized,
                StringComparison.OrdinalIgnoreCase))
            {
                return index;
            }
        }

        return -1;
    }

    private static WorkExperience Clone(WorkExperience experience) => new()
    {
        Id = experience.Id,
        Company = experience.Company,
        Title = experience.Title,
        StartDate = experience.StartDate,
        EndDate = experience.EndDate,
        Bullets = [.. experience.Bullets],
        SkillsGained = experience.SkillsGained is null ? [] : [.. experience.SkillsGained]
    };

    private static Project Clone(Project project) => new()
    {
        Id = project.Id,
        Name = project.Name,
        Url = project.Url,
        StartDate = project.StartDate,
        EndDate = project.EndDate,
        AssociatedWith = project.AssociatedWith,
        Description = project.Description,
        Bullets = [.. project.Bullets],
        SkillsGained = project.SkillsGained is null ? [] : [.. project.SkillsGained]
    };

    private static Education Clone(Education education) => new()
    {
        Id = education.Id,
        School = education.School,
        Degree = education.Degree,
        Field = education.Field,
        StartDate = education.StartDate,
        EndDate = education.EndDate,
        Gpa = education.Gpa,
        SkillsGained = education.SkillsGained is null ? [] : [.. education.SkillsGained]
    };

    private static Certification Clone(Certification certification) => new()
    {
        Id = certification.Id,
        Name = certification.Name,
        IssuingOrganization = certification.IssuingOrganization,
        IssueDate = certification.IssueDate,
        ExpirationDate = certification.ExpirationDate,
        CredentialId = certification.CredentialId,
        CredentialUrl = certification.CredentialUrl,
        SkillsGained = certification.SkillsGained is null ? [] : [.. certification.SkillsGained]
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

    private static GeneratedExperience ToGenerated(
        WorkExperience real,
        WorkExperience enhanced) => new()
    {
        Id = real.Id,
        Company = real.Company,
        Title = real.Title,
        StartDate = real.StartDate,
        EndDate = real.EndDate,
        Bullets = enhanced.EnhancedBullets ?? []
    };

    private static GeneratedProject ToGenerated(Project real, Project enhanced) => new()
    {
        Id = real.Id,
        Name = real.Name,
        Url = real.Url,
        StartDate = real.StartDate,
        EndDate = real.EndDate,
        AssociatedWith = real.AssociatedWith,
        Description = enhanced.Description,
        Bullets = enhanced.EnhancedBullets ?? []
    };
}
