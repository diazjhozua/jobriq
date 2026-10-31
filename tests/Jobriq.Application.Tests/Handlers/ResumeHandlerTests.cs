using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Profiles.GenerateStandaloneResume;
using Jobriq.Application.Resumes.Export;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Application.Resumes.Generate;
using Jobriq.Contracts;
using Jobriq.Domain.Resumes;
using Jobriq.SharedKernel;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.Handlers;

public sealed class GenerateResumeCommandHandlerTests
{
    [Fact]
    public async Task GeneratesSummaryBulletsAndKeywords()
    {
        IResumeAiService aiService = CreateAiService();

        GenerateResumeCommandHandler handler = new(
            aiService,
            new TestTimeProvider(TestData.Now));

        var result = await handler.Handle(
            new GenerateResumeCommand(TestData.Profile(), "Build reliable systems."),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Summary.ShouldBe("Generated summary.");
        result.Value.Experience!.Single().Bullets!.Single().Enhanced
            .ShouldBe("Enhanced: Built a thing");
        result.Value.Projects!.Single().Bullets!.Single().Enhanced
            .ShouldBe("Enhanced: Made it");
        result.Value.Keywords!.Matched.ShouldBe(["C#", "React"]);
        result.Value.Keywords.Missing.ShouldBe(["Kubernetes"]);
        result.Value.GeneratedAt.ShouldBe(TestData.Now);
    }

    [Fact]
    public async Task MissingApiKey_Throws()
    {
        IResumeAiService aiService = Substitute.For<IResumeAiService>();
        aiService.When(service => service.EnsureAvailable()).Throw(new MissingApiKeyException());

        GenerateResumeCommandHandler handler = new(
            aiService,
            new TestTimeProvider(TestData.Now));

        await Should.ThrowAsync<MissingApiKeyException>(async () =>
            await handler.Handle(
                new GenerateResumeCommand(TestData.Profile(), null),
                CancellationToken.None));
    }

    private static IResumeAiService CreateAiService()
    {
        IResumeAiService aiService = Substitute.For<IResumeAiService>();
        aiService
            .EnhanceExperienceBulletsAsync(Arg.Any<WorkExperience>(), Arg.Any<CancellationToken>())
            .Returns(new List<EnhancedBullet>
            {
                new() { Original = "Built a thing", Enhanced = "Enhanced: Built a thing" }
            });
        aiService
            .EnhanceProjectBulletsAsync(Arg.Any<Project>(), Arg.Any<CancellationToken>())
            .Returns(new List<EnhancedBullet>
            {
                new() { Original = "Made it", Enhanced = "Enhanced: Made it" }
            });
        aiService
            .GenerateSummaryAsync(
                Arg.Any<IReadOnlyList<WorkExperience>>(),
                Arg.Any<SummaryType>(),
                Arg.Any<CancellationToken>())
            .Returns("Generated summary.");
        aiService
            .ExtractKeywordsAsync(
                Arg.Any<string>(),
                Arg.Any<ResumeProfile>(),
                Arg.Any<CancellationToken>())
            .Returns(new KeywordMatch { Matched = ["C#", "React"], Missing = ["Kubernetes"] });
        return aiService;
    }
}

public sealed class ExportResumeQueryHandlerTests
{
    [Fact]
    public async Task ExportsDocxWithTimestampedName()
    {
        IResumeExporter exporter = CreateExporter(ExportFormat.Docx);
        ExportResumeQueryHandler handler = new(
            [exporter],
            new TestTimeProvider(TestData.Now));

        var result = await handler.Handle(
            new ExportResumeQuery(TestData.GeneratedResume(), ExportFormatDto.Docx),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.FileName.ShouldBe("jane-doe-resume-20260102-030405.docx");
        result.Value.Content.ShouldBe([1, 2, 3]);
    }

    [Fact]
    public async Task ExportFailure_ThrowsExportFailed()
    {
        IResumeExporter exporter = CreateExporter(ExportFormat.Docx);
        exporter
            .When(candidate => candidate.Export(Arg.Any<GeneratedResume>()))
            .Throw(new InvalidOperationException("Boom."));

        ExportResumeQueryHandler handler = new(
            [exporter],
            new TestTimeProvider(TestData.Now));

        await Should.ThrowAsync<ExportFailedException>(async () =>
            await handler.Handle(
                new ExportResumeQuery(TestData.GeneratedResume(), ExportFormatDto.Docx),
                CancellationToken.None));
    }

    [Fact]
    public async Task UnsupportedFormat_Throws()
    {
        ExportResumeQueryHandler handler = new([], new TestTimeProvider(TestData.Now));

        await Should.ThrowAsync<ArgumentOutOfRangeException>(async () =>
            await handler.Handle(
                new ExportResumeQuery(TestData.GeneratedResume(), ExportFormatDto.Markdown),
                CancellationToken.None));
    }

    private static IResumeExporter CreateExporter(ExportFormat format)
    {
        IResumeExporter exporter = Substitute.For<IResumeExporter>();
        exporter.Format.Returns(format);
        exporter.ContentType.Returns("application/octet-stream");
        exporter.Export(Arg.Any<GeneratedResume>()).Returns([1, 2, 3]);
        return exporter;
    }
}

public sealed class GenerateStandaloneResumeCommandHandlerTests
{
    [Fact]
    public async Task GeneratesAndPersistsResume()
    {
        ICommandHandler<GenerateResumeCommand, GeneratedResumeDto> generateResume =
            Substitute.For<ICommandHandler<GenerateResumeCommand, GeneratedResumeDto>>();
        generateResume
            .Handle(Arg.Any<GenerateResumeCommand>(), Arg.Any<CancellationToken>())
            .Returns(Result.Success(TestData.GeneratedResume()));

        IJobriqRepository repository = Substitute.For<IJobriqRepository>();

        GenerateStandaloneResumeCommandHandler handler = new(
            generateResume,
            repository,
            ClientContext());

        var result = await handler.Handle(
            new GenerateStandaloneResumeCommand(TestData.Profile(), "Build."),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Summary.ShouldBe("Deterministic professional summary.");

        await repository.Received(1).SaveStandaloneResumeAsync(
            TestData.ClientId,
            Arg.Any<GeneratedResume>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GenerationFailure_DoesNotPersist()
    {
        ICommandHandler<GenerateResumeCommand, GeneratedResumeDto> generateResume =
            Substitute.For<ICommandHandler<GenerateResumeCommand, GeneratedResumeDto>>();
        generateResume
            .Handle(Arg.Any<GenerateResumeCommand>(), Arg.Any<CancellationToken>())
            .Returns(Result.Failure<GeneratedResumeDto>(
                Error.Validation("invalid_request", "A profile is required.")));

        IJobriqRepository repository = Substitute.For<IJobriqRepository>();

        GenerateStandaloneResumeCommandHandler handler = new(
            generateResume,
            repository,
            ClientContext());

        var result = await handler.Handle(
            new GenerateStandaloneResumeCommand(null, null),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("invalid_request");

        await repository.DidNotReceive().SaveStandaloneResumeAsync(
            Arg.Any<Guid>(),
            Arg.Any<GeneratedResume>(),
            Arg.Any<CancellationToken>());
    }

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}
