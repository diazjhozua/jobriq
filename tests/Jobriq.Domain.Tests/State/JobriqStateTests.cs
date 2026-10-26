using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;
using Jobriq.Domain.State;
using Shouldly;

namespace Jobriq.Domain.Tests.State;

public sealed class JobriqStateTests
{
    [Fact]
    public void Constructor_CarriesProfileAndApplications()
    {
        ResumeProfile profile = new() { Summary = "Profile summary." };
        JobApplication application = new("Acme", "Engineer", "");
        JobriqState state = new(profile, [application]);

        state.Profile.ShouldBeSameAs(profile);
        state.Applications.ShouldHaveSingleItem().ShouldBeSameAs(application);
    }
}
