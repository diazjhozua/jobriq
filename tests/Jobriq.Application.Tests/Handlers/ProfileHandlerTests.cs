using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Mapping;
using Jobriq.Application.CoverLetters.Export;
using Jobriq.Application.Profiles.Review;
using Jobriq.Application.Profiles.Save;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Application.State.GetState;
using Jobriq.Contracts;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Reviews;
using Jobriq.Domain.Resumes;
using Jobriq.Domain.State;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.Handlers;

public sealed class SaveProfileCommandHandlerTests
{
    [Fact]
    public async Task SavesAndReturnsProfile()
    {
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();

        SaveProfileCommandHandler handler = new(repository, ClientContext());

        var result = await handler.Handle(
            new SaveProfileCommand(TestData.Profile()),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.SummaryType.ShouldBe(SummaryTypeDto.Professional);
        result.Value.Experience!.Single().Company.ShouldBe("Acme");

        await repository.Received(1).SaveProfileAsync(
            TestData.ClientId,
            Arg.Any<ResumeProfile>(),
            Arg.Any<CancellationToken>());
    }

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}

public sealed class ReviewProfileCommandHandlerTests
{
    [Fact]
    public async Task ReturnsNormalizedSuggestions()
    {
        IResumeAiService aiService = Substitute.For<IResumeAiService>();
        aiService
            .ReviewProfileAsync(Arg.Any<ResumeProfile>(), Arg.Any<CancellationToken>())
            .Returns(new List<ReviewSuggestion>
            {
                new()
                {
                    Section = ReviewSection.Summary,
                    Category = ReviewCategory.Completeness,
                    Title = "Add a professional summary",
                    Detail = "Summarize your experience.",
                    ProposedText = "Deterministic reviewed summary."
                },
                new()
                {
                    Section = ReviewSection.Experience,
                    ItemId = TestData.ExperienceId,
                    BulletIndex = 0,
                    Category = ReviewCategory.Impact,
                    Title = "Quantify your impact",
                    Detail = "Add a measurable result.",
                    OriginalText = "Built a thing",
                    ProposedText = "Built a thing\nthat cut latency 40%."
                }
            });

        ReviewProfileCommandHandler handler = new(aiService);

        var result = await handler.Handle(
            new ReviewProfileCommand(TestData.Profile()),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Suggestions.Count.ShouldBe(2);

        ReviewSuggestionDto summary = result.Value.Suggestions[0];
        summary.Section.ShouldBe(ReviewSectionDto.Summary);
        summary.ItemId.ShouldBeNull();

        ReviewSuggestionDto experience = result.Value.Suggestions[1];
        experience.Section.ShouldBe(ReviewSectionDto.Experience);
        experience.ItemId.ShouldBe(TestData.ExperienceId);
        experience.BulletIndex.ShouldBe(0);
        experience.OriginalText.ShouldBe("Built a thing");
        experience.ProposedText.ShouldBe("Built a thing that cut latency 40%.");
    }
}

public sealed class GetStateQueryHandlerTests
{
    [Fact]
    public async Task ReturnsMappedState()
    {
        JobriqState state = new(
            ProfileMappings.ToDomain(TestData.Profile()),
            [],
            ResumeMappings.ToDomain(TestData.GeneratedResume()));

        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .GetStateAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(state);

        GetStateQueryHandler handler = new(repository, ClientContext());

        var result = await handler.Handle(new GetStateQuery(), CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Profile.SummaryType.ShouldBe(SummaryTypeDto.Professional);
        result.Value.Applications.ShouldBeEmpty();
        result.Value.StandaloneResume!.Summary.ShouldBe("Deterministic professional summary.");
    }

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}

public sealed class ExportCoverLetterQueryHandlerTests
{
    [Fact]
    public async Task ExportsDocxWithTimestampedName()
    {
        ICoverLetterExporter exporter = Substitute.For<ICoverLetterExporter>();
        exporter.FileExtension.Returns(".docx");
        exporter.ContentType.Returns("application/octet-stream");
        exporter.Export(Arg.Any<CoverLetter>()).Returns([1, 2, 3]);

        ExportCoverLetterQueryHandler handler = new(
            exporter,
            new TestTimeProvider(TestData.Now));

        var result = await handler.Handle(
            new ExportCoverLetterQuery(TestData.CoverLetter()),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.FileName.ShouldBe("jane-doe-cover-letter-20260102-030405.docx");
    }

    [Fact]
    public async Task ExportFailure_ThrowsExportFailed()
    {
        ICoverLetterExporter exporter = Substitute.For<ICoverLetterExporter>();
        exporter.FileExtension.Returns(".docx");
        exporter
            .When(candidate => candidate.Export(Arg.Any<CoverLetter>()))
            .Throw(new InvalidOperationException("Boom."));

        ExportCoverLetterQueryHandler handler = new(
            exporter,
            new TestTimeProvider(TestData.Now));

        await Should.ThrowAsync<ExportFailedException>(async () =>
            await handler.Handle(
                new ExportCoverLetterQuery(TestData.CoverLetter()),
                CancellationToken.None));
    }
}
