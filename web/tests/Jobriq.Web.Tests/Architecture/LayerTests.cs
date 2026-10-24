using NetArchTest.Rules;
using Shouldly;

namespace Jobriq.Web.Tests.Architecture;

public sealed class LayerTests
{
    [Fact]
    public void Domain_DoesNotDependOnOuterLayers()
    {
        TestResult result = Types.InAssembly(typeof(Jobriq.Domain.Applications.JobApplication).Assembly)
            .ShouldNot()
            .HaveDependencyOnAny("Jobriq.Application", "Jobriq.Infrastructure", "Jobriq.Web")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }

    [Fact]
    public void Application_DoesNotDependOnOuterLayers()
    {
        TestResult result = Types.InAssembly(typeof(Jobriq.Application.DependencyInjection).Assembly)
            .ShouldNot()
            .HaveDependencyOnAny("Jobriq.Infrastructure", "Jobriq.Web")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }

    [Fact]
    public void Infrastructure_DoesNotDependOnWeb()
    {
        TestResult result = Types.InAssembly(typeof(Jobriq.Infrastructure.DependencyInjection).Assembly)
            .ShouldNot()
            .HaveDependencyOn("Jobriq.Web")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }
}
