using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Profiles.SaveProfile;
using Jobriq.Domain.Resumes;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.UseCases;

public sealed class SaveProfileUseCaseTests
{
    private static readonly Guid ClientId = Guid.Parse("9f9e7e6a-0d7f-4f4d-9f5f-2a6c1f0b8e11");

    private readonly IJobriqRepository repository = Substitute.For<IJobriqRepository>();
    private readonly SaveProfileUseCase useCase;

    public SaveProfileUseCaseTests()
    {
        IClientContext clientContext = Substitute.For<IClientContext>();
        clientContext.ClientId.Returns(ClientId);
        useCase = new SaveProfileUseCase(repository, clientContext);
    }

    [Fact]
    public async Task Execute_SavesProfileForCurrentClient()
    {
        ResumeProfile profile = new() { Summary = "Profile summary." };

        ResumeProfile result = await useCase.ExecuteAsync(profile, CancellationToken.None);

        result.ShouldBeSameAs(profile);
        await repository.Received(1).SaveProfileAsync(
            ClientId,
            profile,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_RejectsNullProfile()
    {
        await Should.ThrowAsync<ArgumentNullException>(
            () => useCase.ExecuteAsync(null!, CancellationToken.None));

        await repository.DidNotReceive().SaveProfileAsync(
            Arg.Any<Guid>(),
            Arg.Any<ResumeProfile>(),
            Arg.Any<CancellationToken>());
    }
}
