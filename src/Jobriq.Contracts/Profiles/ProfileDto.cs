using System.Text.Json.Serialization;

namespace Jobriq.Contracts;

public sealed class PersonalInfoDto
{
    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    [JsonPropertyName("linkedin")]
    public string? LinkedIn { get; set; }

    [JsonPropertyName("github")]
    public string? GitHub { get; set; }

    public string? Website { get; set; }
}

public sealed class WorkExperienceDto
{
    public Guid Id { get; set; }

    public string Company { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string StartDate { get; set; } = string.Empty;

    public string EndDate { get; set; } = string.Empty;

    public List<string>? Bullets { get; set; } = [];

    public List<EnhancedBulletDto>? EnhancedBullets { get; set; }
}

public sealed class EducationDto
{
    public Guid Id { get; set; }

    public string School { get; set; } = string.Empty;

    public string Degree { get; set; } = string.Empty;

    public string Field { get; set; } = string.Empty;

    public string StartDate { get; set; } = string.Empty;

    public string EndDate { get; set; } = string.Empty;

    public string? Gpa { get; set; }
}

public sealed class CertificationDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string IssuingOrganization { get; set; } = string.Empty;

    public string IssueDate { get; set; } = string.Empty;

    public string ExpirationDate { get; set; } = string.Empty;

    public string? CredentialId { get; set; }

    public string? CredentialUrl { get; set; }
}

public sealed class AwardDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string AssociatedWith { get; set; } = string.Empty;

    public string Issuer { get; set; } = string.Empty;

    public string IssueDate { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
}

public sealed class ProjectDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Url { get; set; }

    public string StartDate { get; set; } = string.Empty;

    public string EndDate { get; set; } = string.Empty;

    public string AssociatedWith { get; set; } = string.Empty;

    public List<string>? Bullets { get; set; } = [];

    public List<EnhancedBulletDto>? EnhancedBullets { get; set; }
}

public sealed class ProfileDto
{
    public PersonalInfoDto? Personal { get; set; } = new();

    public SummaryTypeDto SummaryType { get; set; } = SummaryTypeDto.Professional;

    public string Summary { get; set; } = string.Empty;

    public List<WorkExperienceDto>? Experience { get; set; } = [];

    public List<EducationDto>? Education { get; set; } = [];

    public List<CertificationDto>? Certifications { get; set; } = [];

    public List<AwardDto>? Awards { get; set; } = [];

    public List<string>? Skills { get; set; } = [];

    public List<ProjectDto>? Projects { get; set; } = [];
}
