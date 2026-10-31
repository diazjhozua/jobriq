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
            .HaveDependencyOnAny(
                "Jobriq.Application",
                "Jobriq.Contracts",
                "Jobriq.Infrastructure",
                "Jobriq.SharedKernel",
                "Jobriq.Web")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }

    [Fact]
    public void Contracts_DoesNotDependOnJobriqLayers()
    {
        TestResult result = Types.InAssembly(typeof(Jobriq.Contracts.ProfileDto).Assembly)
            .ShouldNot()
            .HaveDependencyOnAny(
                "Jobriq.Domain",
                "Jobriq.Application",
                "Jobriq.Infrastructure",
                "Jobriq.SharedKernel",
                "Jobriq.Web")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }

    [Fact]
    public void Contracts_DoesNotDependOnInfrastructureLibraries()
    {
        TestResult result = Types.InAssembly(typeof(Jobriq.Contracts.ProfileDto).Assembly)
            .ShouldNot()
            .HaveDependencyOnAny(
                "Microsoft.AspNetCore",
                "Microsoft.EntityFrameworkCore",
                "Npgsql",
                "FluentValidation",
                "OpenAI")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }

    [Fact]
    public void SharedKernel_DoesNotDependOnJobriqLayers()
    {
        TestResult result = Types.InAssembly(typeof(Jobriq.SharedKernel.Result).Assembly)
            .ShouldNot()
            .HaveDependencyOnAny(
                "Jobriq.Domain",
                "Jobriq.Contracts",
                "Jobriq.Application",
                "Jobriq.Infrastructure",
                "Jobriq.Web")
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

    [Fact]
    public void Infrastructure_DoesNotDependOnContracts()
    {
        TestResult result = Types.InAssembly(typeof(Jobriq.Infrastructure.DependencyInjection).Assembly)
            .ShouldNot()
            .HaveDependencyOn("Jobriq.Contracts")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }

    [Fact]
    public void Application_DoesNotDependOnAspNetCore()
    {
        TestResult result = Types.InAssembly(typeof(Jobriq.Application.DependencyInjection).Assembly)
            .ShouldNot()
            .HaveDependencyOn("Microsoft.AspNetCore")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }

    [Fact]
    public void Domain_DoesNotDependOnEntityFrameworkOrNpgsql()
    {
        TestResult result = Types.InAssembly(typeof(Jobriq.Domain.Applications.JobApplication).Assembly)
            .ShouldNot()
            .HaveDependencyOnAny("Microsoft.EntityFrameworkCore", "Npgsql")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }

    [Fact]
    public void Web_DoesNotDependOnDomain()
    {
        TestResult result = Types.InAssembly(typeof(Program).Assembly)
            .ShouldNot()
            .HaveDependencyOn("Jobriq.Domain")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }

    [Fact]
    public void Endpoints_DoNotReferenceDomain()
    {
        TestResult result = Types.InAssembly(typeof(Program).Assembly)
            .That()
            .ResideInNamespaceStartingWith("Jobriq.Web.Endpoints")
            .ShouldNot()
            .HaveDependencyOn("Jobriq.Domain")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }

    [Fact]
    public void Endpoints_AreSealed()
    {
        TestResult result = Types.InAssembly(typeof(Program).Assembly)
            .That()
            .ResideInNamespaceStartingWith("Jobriq.Web.Endpoints")
            .And()
            .AreClasses()
            .Should()
            .BeSealed()
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }

    [Fact]
    public void ContractsEnums_MatchDomainEnumNames()
    {
        AssertEnumNames<Jobriq.Domain.Resumes.SummaryType, Jobriq.Contracts.SummaryTypeDto>();
        AssertEnumNames<Jobriq.Domain.Applications.ApplicationStatus, Jobriq.Contracts.ApplicationStatusDto>();
        AssertEnumNames<Jobriq.Domain.Reviews.ReviewSection, Jobriq.Contracts.ReviewSectionDto>();
        AssertEnumNames<Jobriq.Domain.Reviews.ReviewCategory, Jobriq.Contracts.ReviewCategoryDto>();
        AssertEnumNames<Jobriq.Application.Resumes.ExportResume.ExportFormat, Jobriq.Contracts.ExportFormatDto>();
    }

    private static void AssertEnumNames<TDomain, TContract>()
        where TDomain : struct, Enum
        where TContract : struct, Enum
    {
        Enum.GetNames<TContract>().ShouldBe(Enum.GetNames<TDomain>());
    }

    [Fact]
    public void Application_DoesNotDependOnEntityFrameworkOrNpgsql()
    {
        TestResult result = Types.InAssembly(typeof(Jobriq.Application.DependencyInjection).Assembly)
            .ShouldNot()
            .HaveDependencyOnAny("Microsoft.EntityFrameworkCore", "Npgsql")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }
}
