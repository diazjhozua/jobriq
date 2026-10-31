using Jobriq.Contracts;
using Jobriq.Domain.Resumes;

namespace Jobriq.Application.Common.Mapping;

public static class ProfileMappings
{
    public static ResumeProfile ToDomain(ProfileDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        return new ResumeProfile
        {
            Personal = dto.Personal is null ? null! : ToDomain(dto.Personal),
            SummaryType = EnumMappings.Map<SummaryTypeDto, SummaryType>(dto.SummaryType),
            Summary = dto.Summary,
            Experience = dto.Experience is null
                ? null!
                : dto.Experience.Select(ToDomain).ToList(),
            Education = dto.Education is null
                ? null!
                : dto.Education.Select(ToDomain).ToList(),
            Certifications = dto.Certifications is null
                ? null!
                : dto.Certifications.Select(ToDomain).ToList(),
            Awards = dto.Awards is null
                ? null!
                : dto.Awards.Select(ToDomain).ToList(),
            Skills = dto.Skills is null ? null! : [.. dto.Skills],
            Projects = dto.Projects is null
                ? null!
                : dto.Projects.Select(ToDomain).ToList()
        };
    }

    public static ProfileDto ToDto(ResumeProfile profile)
    {
        ArgumentNullException.ThrowIfNull(profile);

        return new ProfileDto
        {
            Personal = profile.Personal is null ? null : ToDto(profile.Personal),
            SummaryType = EnumMappings.Map<SummaryType, SummaryTypeDto>(profile.SummaryType),
            Summary = profile.Summary,
            Experience = profile.Experience is null
                ? null
                : profile.Experience.Select(ToDto).ToList(),
            Education = profile.Education is null
                ? null
                : profile.Education.Select(ToDto).ToList(),
            Certifications = profile.Certifications is null
                ? null
                : profile.Certifications.Select(ToDto).ToList(),
            Awards = profile.Awards is null
                ? null
                : profile.Awards.Select(ToDto).ToList(),
            Skills = profile.Skills is null ? null : [.. profile.Skills],
            Projects = profile.Projects is null
                ? null
                : profile.Projects.Select(ToDto).ToList()
        };
    }

    public static PersonalInfo ToDomain(PersonalInfoDto dto) => new()
    {
        Name = dto.Name,
        Email = dto.Email,
        Phone = dto.Phone,
        Location = dto.Location,
        LinkedIn = dto.LinkedIn,
        GitHub = dto.GitHub,
        Website = dto.Website
    };

    public static PersonalInfoDto ToDto(PersonalInfo info) => new()
    {
        Name = info.Name,
        Email = info.Email,
        Phone = info.Phone,
        Location = info.Location,
        LinkedIn = info.LinkedIn,
        GitHub = info.GitHub,
        Website = info.Website
    };

    public static WorkExperience ToDomain(WorkExperienceDto dto) => new()
    {
        Id = dto.Id,
        Company = dto.Company,
        Title = dto.Title,
        StartDate = dto.StartDate,
        EndDate = dto.EndDate,
        Bullets = dto.Bullets is null ? null! : [.. dto.Bullets],
        EnhancedBullets = dto.EnhancedBullets?.Select(ToDomain).ToList()
    };

    public static WorkExperienceDto ToDto(WorkExperience experience) => new()
    {
        Id = experience.Id,
        Company = experience.Company,
        Title = experience.Title,
        StartDate = experience.StartDate,
        EndDate = experience.EndDate,
        Bullets = experience.Bullets is null ? null : [.. experience.Bullets],
        EnhancedBullets = experience.EnhancedBullets?.Select(ToDto).ToList()
    };

    public static Education ToDomain(EducationDto dto) => new()
    {
        Id = dto.Id,
        School = dto.School,
        Degree = dto.Degree,
        Field = dto.Field,
        StartDate = dto.StartDate,
        EndDate = dto.EndDate,
        Gpa = dto.Gpa
    };

    public static EducationDto ToDto(Education education) => new()
    {
        Id = education.Id,
        School = education.School,
        Degree = education.Degree,
        Field = education.Field,
        StartDate = education.StartDate,
        EndDate = education.EndDate,
        Gpa = education.Gpa
    };

    public static Certification ToDomain(CertificationDto dto) => new()
    {
        Id = dto.Id,
        Name = dto.Name,
        IssuingOrganization = dto.IssuingOrganization,
        IssueDate = dto.IssueDate,
        ExpirationDate = dto.ExpirationDate,
        CredentialId = dto.CredentialId,
        CredentialUrl = dto.CredentialUrl
    };

    public static CertificationDto ToDto(Certification certification) => new()
    {
        Id = certification.Id,
        Name = certification.Name,
        IssuingOrganization = certification.IssuingOrganization,
        IssueDate = certification.IssueDate,
        ExpirationDate = certification.ExpirationDate,
        CredentialId = certification.CredentialId,
        CredentialUrl = certification.CredentialUrl
    };

    public static Award ToDomain(AwardDto dto) => new()
    {
        Id = dto.Id,
        Title = dto.Title,
        AssociatedWith = dto.AssociatedWith,
        Issuer = dto.Issuer,
        IssueDate = dto.IssueDate,
        Description = dto.Description
    };

    public static AwardDto ToDto(Award award) => new()
    {
        Id = award.Id,
        Title = award.Title,
        AssociatedWith = award.AssociatedWith,
        Issuer = award.Issuer,
        IssueDate = award.IssueDate,
        Description = award.Description
    };

    public static Project ToDomain(ProjectDto dto) => new()
    {
        Id = dto.Id,
        Name = dto.Name,
        Url = dto.Url,
        StartDate = dto.StartDate,
        EndDate = dto.EndDate,
        AssociatedWith = dto.AssociatedWith,
        Bullets = dto.Bullets is null ? null! : [.. dto.Bullets],
        EnhancedBullets = dto.EnhancedBullets?.Select(ToDomain).ToList()
    };

    public static ProjectDto ToDto(Project project) => new()
    {
        Id = project.Id,
        Name = project.Name,
        Url = project.Url,
        StartDate = project.StartDate,
        EndDate = project.EndDate,
        AssociatedWith = project.AssociatedWith,
        Bullets = project.Bullets is null ? null : [.. project.Bullets],
        EnhancedBullets = project.EnhancedBullets?.Select(ToDto).ToList()
    };

    public static EnhancedBullet ToDomain(EnhancedBulletDto dto) => new()
    {
        Original = dto.Original,
        Enhanced = dto.Enhanced
    };

    public static EnhancedBulletDto ToDto(EnhancedBullet bullet) => new()
    {
        Original = bullet.Original,
        Enhanced = bullet.Enhanced
    };
}
