namespace Jobriq.Contracts;

public sealed class EnhancedBulletDto
{
    public string Original { get; set; } = string.Empty;

    public string Enhanced { get; set; } = string.Empty;
}

public sealed class GeneratedExperienceDto
{
    public Guid Id { get; set; }

    public string Company { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string StartDate { get; set; } = string.Empty;

    public string EndDate { get; set; } = string.Empty;

    public List<EnhancedBulletDto>? Bullets { get; set; } = [];
}

public sealed class GeneratedProjectDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Url { get; set; }

    public string StartDate { get; set; } = string.Empty;

    public string EndDate { get; set; } = string.Empty;

    public string AssociatedWith { get; set; } = string.Empty;

    public List<EnhancedBulletDto>? Bullets { get; set; } = [];
}

public sealed class KeywordMatchDto
{
    public List<string>? Matched { get; set; } = [];

    public List<string>? Missing { get; set; } = [];
}

public sealed class GeneratedResumeDto
{
    public PersonalInfoDto? Personal { get; set; } = new();

    public string Summary { get; set; } = string.Empty;

    public List<GeneratedExperienceDto>? Experience { get; set; } = [];

    public List<EducationDto>? Education { get; set; } = [];

    public List<CertificationDto>? Certifications { get; set; } = [];

    public List<AwardDto>? Awards { get; set; } = [];

    public List<string>? Skills { get; set; } = [];

    public List<GeneratedProjectDto>? Projects { get; set; } = [];

    public KeywordMatchDto? Keywords { get; set; }

    public DateTimeOffset GeneratedAt { get; set; }
}
