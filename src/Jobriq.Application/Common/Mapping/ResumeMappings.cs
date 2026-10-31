using Jobriq.Contracts;
using Jobriq.Domain.Resumes;

namespace Jobriq.Application.Common.Mapping;

public static class ResumeMappings
{
    public static GeneratedResume ToDomain(GeneratedResumeDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        return new GeneratedResume
        {
            Personal = dto.Personal is null ? null! : ProfileMappings.ToDomain(dto.Personal),
            Summary = dto.Summary,
            Experience = dto.Experience is null
                ? null!
                : dto.Experience.Select(ToDomain).ToList(),
            Education = dto.Education is null
                ? null!
                : dto.Education.Select(ProfileMappings.ToDomain).ToList(),
            Certifications = dto.Certifications is null
                ? null!
                : dto.Certifications.Select(ProfileMappings.ToDomain).ToList(),
            Awards = dto.Awards is null
                ? null!
                : dto.Awards.Select(ProfileMappings.ToDomain).ToList(),
            Skills = dto.Skills is null ? null! : [.. dto.Skills],
            Projects = dto.Projects is null
                ? null!
                : dto.Projects.Select(ToDomain).ToList(),
            Keywords = dto.Keywords is null ? null : ToDomain(dto.Keywords),
            GeneratedAt = dto.GeneratedAt
        };
    }

    public static GeneratedResumeDto ToDto(GeneratedResume resume)
    {
        ArgumentNullException.ThrowIfNull(resume);

        return new GeneratedResumeDto
        {
            Personal = resume.Personal is null ? null : ProfileMappings.ToDto(resume.Personal),
            Summary = resume.Summary,
            Experience = resume.Experience is null
                ? null
                : resume.Experience.Select(ToDto).ToList(),
            Education = resume.Education is null
                ? null
                : resume.Education.Select(ProfileMappings.ToDto).ToList(),
            Certifications = resume.Certifications is null
                ? null
                : resume.Certifications.Select(ProfileMappings.ToDto).ToList(),
            Awards = resume.Awards is null
                ? null
                : resume.Awards.Select(ProfileMappings.ToDto).ToList(),
            Skills = resume.Skills is null ? null : [.. resume.Skills],
            Projects = resume.Projects is null
                ? null
                : resume.Projects.Select(ToDto).ToList(),
            Keywords = resume.Keywords is null ? null : ToDto(resume.Keywords),
            GeneratedAt = resume.GeneratedAt
        };
    }

    public static GeneratedExperience ToDomain(GeneratedExperienceDto dto) => new()
    {
        Id = dto.Id,
        Company = dto.Company,
        Title = dto.Title,
        StartDate = dto.StartDate,
        EndDate = dto.EndDate,
        Bullets = dto.Bullets is null
            ? null!
            : dto.Bullets.Select(ProfileMappings.ToDomain).ToList()
    };

    public static GeneratedExperienceDto ToDto(GeneratedExperience experience) => new()
    {
        Id = experience.Id,
        Company = experience.Company,
        Title = experience.Title,
        StartDate = experience.StartDate,
        EndDate = experience.EndDate,
        Bullets = experience.Bullets is null
            ? null
            : experience.Bullets.Select(ProfileMappings.ToDto).ToList()
    };

    public static GeneratedProject ToDomain(GeneratedProjectDto dto) => new()
    {
        Id = dto.Id,
        Name = dto.Name,
        Url = dto.Url,
        StartDate = dto.StartDate,
        EndDate = dto.EndDate,
        AssociatedWith = dto.AssociatedWith,
        Bullets = dto.Bullets is null
            ? null!
            : dto.Bullets.Select(ProfileMappings.ToDomain).ToList()
    };

    public static GeneratedProjectDto ToDto(GeneratedProject project) => new()
    {
        Id = project.Id,
        Name = project.Name,
        Url = project.Url,
        StartDate = project.StartDate,
        EndDate = project.EndDate,
        AssociatedWith = project.AssociatedWith,
        Bullets = project.Bullets is null
            ? null
            : project.Bullets.Select(ProfileMappings.ToDto).ToList()
    };

    public static KeywordMatch ToDomain(KeywordMatchDto dto) => new()
    {
        Matched = dto.Matched is null ? null! : [.. dto.Matched],
        Missing = dto.Missing is null ? null! : [.. dto.Missing]
    };

    public static KeywordMatchDto ToDto(KeywordMatch match) => new()
    {
        Matched = match.Matched is null ? null : [.. match.Matched],
        Missing = match.Missing is null ? null : [.. match.Missing]
    };
}
