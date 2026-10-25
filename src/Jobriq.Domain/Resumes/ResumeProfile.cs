namespace Jobriq.Domain.Resumes;

public sealed class ResumeProfile
{
    public PersonalInfo Personal { get; set; } = new();

    public SummaryType SummaryType { get; set; } = SummaryType.Professional;

    public string Summary { get; set; } = string.Empty;

    public List<WorkExperience> Experience { get; set; } = [];

    public List<Education> Education { get; set; } = [];

    public List<string> Skills { get; set; } = [];

    public List<Project> Projects { get; set; } = [];
}
