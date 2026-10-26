using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Applications.UpdateApplicationStatus;
using Jobriq.Domain.Applications;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.UseCases;

public sealed class UpdateApplicationStatusUseCaseTests
{
    private static readonly Guid ClientId = Guid.Parse("9f9e7e6a-0d7f-4f4d-9f5f-2a6c1f0b8e11");

    private readonly IJobriqRepository repository = Substitute.For<IJobriqRepository>();
    private readonly UpdateApplicationStatusUseCase useCase;

    public UpdateApplicationStatusUseCaseTests()
    {
        IClientContext clientContext = Substitute.For<IClientContext>();
        clientContext.ClientId.Returns(ClientId);
        useCase = new UpdateApplicationStatusUseCase(repository, clientContext);
    }

    [Fact]
    public async Task Execute_UpdatesStatusForCurrentClient()
    {
        Guid applicationId = Guid.NewGuid();
        JobApplication updated = new("Acme", "Engineer", "");
        updated.ChangeStatus(ApplicationStatus.Interviewing);
        repository
            .UpdateStatusAsync(
                ClientId,
                applicationId,
                ApplicationStatus.Interviewing,
                Arg.Any<CancellationToken>())
            .Returns(updated);

        JobApplication result = await useCase.ExecuteAsync(
            applicationId,
            ApplicationStatus.Interviewing,
            CancellationToken.None);

        result.ShouldBeSameAs(updated);
        await repository.Received(1).UpdateStatusAsync(
            ClientId,
            applicationId,
            ApplicationStatus.Interviewing,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_RejectsUndefinedStatus()
    {
        await Should.ThrowAsync<ArgumentOutOfRangeException>(
            () => useCase.ExecuteAsync(Guid.NewGuid(), (ApplicationStatus)999, CancellationToken.None));

        await repository.DidNotReceive().UpdateStatusAsync(
            Arg.Any<Guid>(),
            Arg.Any<Guid>(),
            Arg.Any<ApplicationStatus>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_ThrowsWhenApplicationMissing()
    {
        Guid applicationId = Guid.NewGuid();
        repository
            .UpdateStatusAsync(
                ClientId,
                applicationId,
                ApplicationStatus.Applied,
                Arg.Any<CancellationToken>())
            .Returns((JobApplication?)null);

        JobriqResourceNotFoundException exception = await Should.ThrowAsync<JobriqResourceNotFoundException>(
            () => useCase.ExecuteAsync(
                applicationId,
                ApplicationStatus.Applied,
                CancellationToken.None));

        exception.Resource.ShouldBe("application");
        exception.Id.ShouldBe(applicationId);
    }
}
