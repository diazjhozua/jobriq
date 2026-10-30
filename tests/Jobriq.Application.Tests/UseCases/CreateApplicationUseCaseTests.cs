using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Applications.CreateApplication;
using Jobriq.Domain.Applications;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.UseCases;

public sealed class CreateApplicationUseCaseTests
{
    private static readonly Guid ClientId = Guid.Parse("9f9e7e6a-0d7f-4f4d-9f5f-2a6c1f0b8e11");

    private readonly IJobriqRepository repository = Substitute.For<IJobriqRepository>();
    private readonly CreateApplicationUseCase useCase;

    public CreateApplicationUseCaseTests()
    {
        IClientContext clientContext = Substitute.For<IClientContext>();
        clientContext.ClientId.Returns(ClientId);
        useCase = new CreateApplicationUseCase(repository, clientContext);
    }

    [Fact]
    public async Task Execute_CreatesApplicationWithRequestedStatus()
    {
        JobApplication created = new("Acme", "Engineer", "Build things.");
        repository
            .AddApplicationAsync(ClientId, Arg.Any<JobApplication>(), Arg.Any<CancellationToken>())
            .Returns(created);

        JobApplication result = await useCase.ExecuteAsync(
            " Acme ",
            " Engineer ",
            "Build things.",
            ApplicationStatus.Applied,
            null,
            CancellationToken.None);

        result.ShouldBeSameAs(created);
        await repository.Received(1).AddApplicationAsync(
            ClientId,
            Arg.Is<JobApplication>(application =>
                application.Company == "Acme"
                && application.Role == "Engineer"
                && application.JobDescription == "Build things."
                && application.Status == ApplicationStatus.Applied),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_DefaultsToSavedWithoutStatus()
    {
        JobApplication created = new("Acme", "Engineer", "");
        repository
            .AddApplicationAsync(ClientId, Arg.Any<JobApplication>(), Arg.Any<CancellationToken>())
            .Returns(created);

        await useCase.ExecuteAsync("Acme", "Engineer", "", null, null, CancellationToken.None);

        await repository.Received(1).AddApplicationAsync(
            ClientId,
            Arg.Is<JobApplication>(application => application.Status == ApplicationStatus.Saved),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_StoresAppliedDate()
    {
        JobApplication created = new("Acme", "Engineer", "");
        repository
            .AddApplicationAsync(ClientId, Arg.Any<JobApplication>(), Arg.Any<CancellationToken>())
            .Returns(created);

        DateOnly appliedDate = new(2022, 8, 1);
        await useCase.ExecuteAsync(
            "Acme",
            "Engineer",
            "",
            null,
            appliedDate,
            CancellationToken.None);

        await repository.Received(1).AddApplicationAsync(
            ClientId,
            Arg.Is<JobApplication>(application => application.AppliedDate == appliedDate),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_RejectsUndefinedStatus()
    {
        await Should.ThrowAsync<ArgumentOutOfRangeException>(
            () => useCase.ExecuteAsync(
                "Acme",
                "Engineer",
                "",
                (ApplicationStatus)999,
                null,
                CancellationToken.None));

        await repository.DidNotReceive().AddApplicationAsync(
            Arg.Any<Guid>(),
            Arg.Any<JobApplication>(),
            Arg.Any<CancellationToken>());
    }
}
