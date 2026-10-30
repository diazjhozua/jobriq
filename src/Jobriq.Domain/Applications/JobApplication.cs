using Jobriq.Domain.Resumes;

namespace Jobriq.Domain.Applications;

public sealed class JobApplication
{
    public JobApplication(
        string company,
        string role,
        string jobDescription,
        DateOnly? appliedDate = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(company);
        ArgumentException.ThrowIfNullOrWhiteSpace(role);

        Company = company.Trim();
        Role = role.Trim();
        JobDescription = jobDescription;
        AppliedDate = appliedDate;
    }

    public Guid Id { get; init; } = Guid.NewGuid();

    public string Company { get; private set; }

    public string Role { get; private set; }

    public string JobDescription { get; }

    public ApplicationStatus Status { get; private set; } = ApplicationStatus.Saved;

    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;

    public DateOnly? AppliedDate { get; private set; }

    public GeneratedResume? GeneratedResume { get; private set; }

    public CoverLetter? CoverLetter { get; private set; }

    public static JobApplication Restore(
        Guid id,
        string company,
        string role,
        string jobDescription,
        ApplicationStatus status,
        DateTimeOffset createdAt,
        GeneratedResume? generatedResume,
        CoverLetter? coverLetter = null,
        DateOnly? appliedDate = null)
    {
        JobApplication application = new(company, role, jobDescription, appliedDate)
        {
            Id = id,
            CreatedAt = createdAt,
        };

        application.ChangeStatus(status);

        if (generatedResume is not null)
        {
            application.AttachGeneratedResume(generatedResume);
        }

        if (coverLetter is not null)
        {
            application.AttachCoverLetter(coverLetter);
        }

        return application;
    }

    public void UpdateDetails(string company, string role, DateOnly? appliedDate)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(company);
        ArgumentException.ThrowIfNullOrWhiteSpace(role);

        Company = company.Trim();
        Role = role.Trim();
        AppliedDate = appliedDate;
    }

    public void ChangeStatus(ApplicationStatus status)
    {
        if (!Enum.IsDefined(status))
        {
            throw new ArgumentOutOfRangeException(nameof(status), status, "Unknown application status.");
        }

        Status = status;
    }

    public void AttachGeneratedResume(GeneratedResume resume)
    {
        ArgumentNullException.ThrowIfNull(resume);

        GeneratedResume = resume;
    }

    public void AttachCoverLetter(CoverLetter coverLetter)
    {
        ArgumentNullException.ThrowIfNull(coverLetter);

        CoverLetter = coverLetter;
    }
}
