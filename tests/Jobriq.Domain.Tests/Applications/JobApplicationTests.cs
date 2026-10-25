using Jobriq.Domain.Applications;
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
}
