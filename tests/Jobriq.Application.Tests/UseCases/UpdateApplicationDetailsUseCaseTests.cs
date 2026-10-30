using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Applications.UpdateApplicationDetails;
using Jobriq.Domain.Applications;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.UseCases;

public sealed class UpdateApplicationDetailsUseCaseTests
{
    private static readonly Guid ClientId = Guid.Parse("9f9e7e6a-0d7f-4f4d-9f5f-2a6c1f0b8e11");

    private readonly IJobriqRepository repository = Substitute.For<IJobriqRepository>();
    private readonly UpdateApplicationDetailsUseCase useCase;

    public UpdateApplicationDetailsUseCaseTests()
    {
        IClientContext clientContext = Substitute.For<IClientContext>();
        clientContext.ClientId.Returns(ClientId);
        useCase = new UpdateApplicationDetailsUseCase(repository, clientContext);
    }

    [Fact]
    public async Task Execute_UpdatesDetailsForCurrentClient()
    {
        Guid applicationId = Guid.NewGuid();
        DateOnly appliedDate = new(2022, 8, 1);
        JobApplication updated = new("Globex", "Developer", "", appliedDate);
        repository
            .UpdateApplicationDetailsAsync(
                ClientId,
                applicationId,
                "Globex",
                "Developer",
                appliedDate,
                Arg.Any<CancellationToken>())
            .Returns(updated);

        JobApplication result = await useCase.ExecuteAsync(
            applicationId,
            "Globex",
            "Developer",
            appliedDate,
            CancellationToken.None);

        result.ShouldBeSameAs(updated);
        await repository.Received(1).UpdateApplicationDetailsAsync(
            ClientId,
            applicationId,
            "Globex",
            "Developer",
            appliedDate,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_ThrowsWhenApplicationMissing()
    {
        Guid applicationId = Guid.NewGuid();
        repository
            .UpdateApplicationDetailsAsync(
                ClientId,
                applicationId,
                "Globex",
                "Developer",
                null,
                Arg.Any<CancellationToken>())
            .Returns((JobApplication?)null);

        JobriqResourceNotFoundException exception = await Should.ThrowAsync<JobriqResourceNotFoundException>(
            () => useCase.ExecuteAsync(
                applicationId,
                "Globex",
                "Developer",
                null,
                CancellationToken.None));

        exception.Resource.ShouldBe("application");
        exception.Id.ShouldBe(applicationId);
    }
}
