using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Applications.SaveGeneratedResume;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.UseCases;

public sealed class SaveGeneratedResumeUseCaseTests
{
    private static readonly Guid ClientId = Guid.Parse("9f9e7e6a-0d7f-4f4d-9f5f-2a6c1f0b8e11");

    private readonly IJobriqRepository repository = Substitute.For<IJobriqRepository>();
    private readonly SaveGeneratedResumeUseCase useCase;

    public SaveGeneratedResumeUseCaseTests()
    {
        IClientContext clientContext = Substitute.For<IClientContext>();
        clientContext.ClientId.Returns(ClientId);
        useCase = new SaveGeneratedResumeUseCase(repository, clientContext);
    }

    [Fact]
    public async Task Execute_SavesResumeForCurrentClient()
    {
        Guid applicationId = Guid.NewGuid();
        GeneratedResume resume = new() { Summary = "Tailored summary." };
        JobApplication updated = new("Acme", "Engineer", "");
        updated.AttachGeneratedResume(resume);
        repository
            .SaveGeneratedResumeAsync(ClientId, applicationId, resume, Arg.Any<CancellationToken>())
            .Returns(updated);

        JobApplication result = await useCase.ExecuteAsync(
            applicationId,
            resume,
            CancellationToken.None);

        result.ShouldBeSameAs(updated);
        await repository.Received(1).SaveGeneratedResumeAsync(
            ClientId,
            applicationId,
            resume,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_RejectsNullResume()
    {
        await Should.ThrowAsync<ArgumentNullException>(
            () => useCase.ExecuteAsync(Guid.NewGuid(), null!, CancellationToken.None));

        await repository.DidNotReceive().SaveGeneratedResumeAsync(
            Arg.Any<Guid>(),
            Arg.Any<Guid>(),
            Arg.Any<GeneratedResume>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Execute_ThrowsWhenApplicationMissing()
    {
        Guid applicationId = Guid.NewGuid();
        GeneratedResume resume = new();
        repository
            .SaveGeneratedResumeAsync(
                ClientId,
                applicationId,
                resume,
                Arg.Any<CancellationToken>())
            .Returns((JobApplication?)null);

        JobriqResourceNotFoundException exception = await Should.ThrowAsync<JobriqResourceNotFoundException>(
            () => useCase.ExecuteAsync(applicationId, resume, CancellationToken.None));

        exception.Resource.ShouldBe("application");
        exception.Id.ShouldBe(applicationId);
    }
}
