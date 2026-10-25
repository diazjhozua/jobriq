namespace Jobriq.Domain.Applications;

public sealed class JobApplication
{
    public JobApplication(string company, string role, string jobDescription)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(company);
        ArgumentException.ThrowIfNullOrWhiteSpace(role);

        Company = company.Trim();
        Role = role.Trim();
        JobDescription = jobDescription;
    }

    public Guid Id { get; init; } = Guid.NewGuid();

    public string Company { get; }

    public string Role { get; }

    public string JobDescription { get; }

    public ApplicationStatus Status { get; private set; } = ApplicationStatus.Saved;

    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;

    public void ChangeStatus(ApplicationStatus status)
    {
        if (!Enum.IsDefined(status))
        {
            throw new ArgumentOutOfRangeException(nameof(status), status, "Unknown application status.");
        }

        Status = status;
    }
}
