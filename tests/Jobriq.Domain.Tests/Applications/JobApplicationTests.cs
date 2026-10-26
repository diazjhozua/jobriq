using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;
using Shouldly;

namespace Jobriq.Domain.Tests.Applications;

public sealed class JobApplicationTests
{
    [Fact]
    public void Constructor_TrimsCompanyAndRole_AndStartsAsSaved()
    {
        JobApplication application = new("  Acme  ", "  Engineer  ", "Build things.");

        application.Company.ShouldBe("Acme");
        application.Role.ShouldBe("Engineer");
        application.JobDescription.ShouldBe("Build things.");
        application.Status.ShouldBe(ApplicationStatus.Saved);
        application.Id.ShouldNotBe(Guid.Empty);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_RejectsEmptyCompany(string company)
    {
        Should.Throw<ArgumentException>(() => new JobApplication(company, "Engineer", ""));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_RejectsEmptyRole(string role)
    {
        Should.Throw<ArgumentException>(() => new JobApplication("Acme", role, ""));
    }

    [Theory]
    [InlineData(ApplicationStatus.Saved)]
    [InlineData(ApplicationStatus.Applied)]
    [InlineData(ApplicationStatus.Interviewing)]
    [InlineData(ApplicationStatus.Offer)]
    [InlineData(ApplicationStatus.Rejected)]
    public void ChangeStatus_AcceptsEveryDefinedStatus(ApplicationStatus status)
    {
        JobApplication application = new("Acme", "Engineer", "");

        application.ChangeStatus(status);

        application.Status.ShouldBe(status);
    }

    [Fact]
    public void ChangeStatus_RejectsUndefinedStatus()
    {
        JobApplication application = new("Acme", "Engineer", "");

        Should.Throw<ArgumentOutOfRangeException>(
            () => application.ChangeStatus((ApplicationStatus)999));
    }

    [Fact]
    public void AttachGeneratedResume_StoresResume()
    {
        JobApplication application = new("Acme", "Engineer", "");
        GeneratedResume resume = new() { Summary = "Tailored summary." };

        application.AttachGeneratedResume(resume);

        application.GeneratedResume.ShouldBeSameAs(resume);
    }

    [Fact]
    public void AttachGeneratedResume_RejectsNull()
    {
        JobApplication application = new("Acme", "Engineer", "");

        Should.Throw<ArgumentNullException>(() => application.AttachGeneratedResume(null!));
    }

    [Fact]
    public void Restore_PreservesPersistedValues()
    {
        Guid id = Guid.NewGuid();
        DateTimeOffset createdAt = new(2026, 10, 1, 12, 30, 0, TimeSpan.Zero);
        GeneratedResume resume = new() { Summary = "Tailored summary." };

        JobApplication application = JobApplication.Restore(
            id,
            "Acme",
            "Engineer",
            "Build things.",
            ApplicationStatus.Interviewing,
            createdAt,
            resume);

        application.Id.ShouldBe(id);
        application.Company.ShouldBe("Acme");
        application.Role.ShouldBe("Engineer");
        application.JobDescription.ShouldBe("Build things.");
        application.Status.ShouldBe(ApplicationStatus.Interviewing);
        application.CreatedAt.ShouldBe(createdAt);
        application.GeneratedResume.ShouldBeSameAs(resume);
    }

    [Fact]
    public void Restore_RejectsUndefinedStatus()
    {
        Should.Throw<ArgumentOutOfRangeException>(() => JobApplication.Restore(
            Guid.NewGuid(),
            "Acme",
            "Engineer",
            "",
            (ApplicationStatus)999,
            DateTimeOffset.UtcNow,
            null));
    }
}
