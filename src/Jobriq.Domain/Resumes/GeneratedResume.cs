namespace Jobriq.Domain.Resumes;

public sealed class GeneratedResume
{
    public PersonalInfo Personal { get; set; } = new();

    public string Summary { get; set; } = string.Empty;

    public List<GeneratedExperience> Experience { get; set; } = [];

    public List<Education> Education { get; set; } = [];

    public List<Certification> Certifications { get; set; } = [];

    public List<Award> Awards { get; set; } = [];

    public List<string> Skills { get; set; } = [];

    public List<GeneratedProject> Projects { get; set; } = [];

    public KeywordMatch? Keywords { get; set; }

    public DateTimeOffset GeneratedAt { get; set; }
}
