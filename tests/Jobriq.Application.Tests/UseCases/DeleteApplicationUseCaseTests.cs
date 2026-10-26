using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Applications.DeleteApplication;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.UseCases;

public sealed class DeleteApplicationUseCaseTests
{
    private static readonly Guid ClientId = Guid.Parse("9f9e7e6a-0d7f-4f4d-9f5f-2a6c1f0b8e11");

    private readonly IJobriqRepository repository = Substitute.For<IJobriqRepository>();
    private readonly DeleteApplicationUseCase useCase;

    public DeleteApplicationUseCaseTests()
    {
        IClientContext clientContext = Substitute.For<IClientContext>();
        clientContext.ClientId.Returns(ClientId);
        useCase = new DeleteApplicationUseCase(repository, clientContext);
    }

    [Fact]
    public async Task Execute_DeletesApplicationForCurrentClient()
    {
        Guid applicationId = Guid.NewGuid();
        repository
            .DeleteApplicationAsync(ClientId, applicationId, Arg.Any<CancellationToken>())
            .Returns(true);

        await useCase.ExecuteAsync(applicationId, CancellationToken.None);

        await repository.Received(1).DeleteApplicationAsync(
            ClientId,
            applicationId,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_ThrowsWhenApplicationMissing()
    {
        Guid applicationId = Guid.NewGuid();
        repository
            .DeleteApplicationAsync(ClientId, applicationId, Arg.Any<CancellationToken>())
            .Returns(false);

        JobriqResourceNotFoundException exception = await Should.ThrowAsync<JobriqResourceNotFoundException>(
            () => useCase.ExecuteAsync(applicationId, CancellationToken.None));

        exception.Resource.ShouldBe("application");
        exception.Id.ShouldBe(applicationId);
    }
}
