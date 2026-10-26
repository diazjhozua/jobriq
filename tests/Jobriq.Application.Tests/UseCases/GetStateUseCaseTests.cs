using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.State.GetState;
using Jobriq.Domain.Resumes;
using Jobriq.Domain.State;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.UseCases;

public sealed class GetStateUseCaseTests
{
    private static readonly Guid ClientId = Guid.Parse("9f9e7e6a-0d7f-4f4d-9f5f-2a6c1f0b8e11");

    private readonly IJobriqRepository repository = Substitute.For<IJobriqRepository>();
    private readonly GetStateUseCase useCase;

    public GetStateUseCaseTests()
    {
        IClientContext clientContext = Substitute.For<IClientContext>();
        clientContext.ClientId.Returns(ClientId);
        useCase = new GetStateUseCase(repository, clientContext);
    }

    [Fact]
    public async Task Execute_ReturnsStateForCurrentClient()
    {
        JobriqState state = new(new ResumeProfile(), []);
        repository.GetStateAsync(ClientId, Arg.Any<CancellationToken>()).Returns(state);

        JobriqState result = await useCase.ExecuteAsync(CancellationToken.None);

        result.ShouldBeSameAs(state);
        await repository.Received(1).GetStateAsync(ClientId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_PropagatesPersistenceFailure()
    {
        repository.GetStateAsync(ClientId, Arg.Any<CancellationToken>())
            .Returns(Task.FromException<JobriqState>(
                new JobriqPersistenceUnavailableException(
                    "Database unavailable.",
                    new InvalidOperationException("boom"))));

        await Should.ThrowAsync<JobriqPersistenceUnavailableException>(
            () => useCase.ExecuteAsync(CancellationToken.None));
    }
}
