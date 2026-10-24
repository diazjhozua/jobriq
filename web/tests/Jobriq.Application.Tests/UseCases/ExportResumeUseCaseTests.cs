using Jobriq.Application.Abstractions;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Domain.Resumes;
using Shouldly;

namespace Jobriq.Application.Tests.UseCases;

public sealed class ExportResumeUseCaseTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 24, 12, 34, 56, TimeSpan.Zero);

    [Theory]
    [InlineData(ExportFormat.Docx, "jane-doe-resume-20261024-123456.docx")]
    [InlineData(ExportFormat.Markdown, "jane-doe-resume-20261024-123456.md")]
    public void Execute_SelectsExporterAndNamesFile(ExportFormat format, string expectedName)
    {
        StubExporter exporter = new(format, [1, 2, 3], "test/content");
        ExportResumeUseCase useCase = new([exporter], new TestTimeProvider(Now));

        ExportedFile file = useCase.Execute(CreateResume(), format);

        file.Content.ShouldBe([1, 2, 3]);
        file.ContentType.ShouldBe("test/content");
        file.FileName.ShouldBe(expectedName);
        exporter.ExportCount.ShouldBe(1);
    }

    [Fact]
    public void Execute_RejectsUnsupportedFormat()
    {
        ExportResumeUseCase useCase = new([], new TestTimeProvider(Now));

        Should.Throw<ArgumentOutOfRangeException>(
            () => useCase.Execute(CreateResume(), (ExportFormat)99));
    }

    [Fact]
    public void Execute_WrapsExporterFailures()
    {
        StubExporter exporter = new(ExportFormat.Docx, [], "test/content")
        {
            Failure = new InvalidOperationException("boom")
        };
        ExportResumeUseCase useCase = new([exporter], new TestTimeProvider(Now));

        ExportFailedException exception = Should.Throw<ExportFailedException>(
            () => useCase.Execute(CreateResume(), ExportFormat.Docx));
        exception.InnerException.ShouldBe(exporter.Failure);
    }

    private static GeneratedResume CreateResume() => new()
    {
        Personal = new PersonalInfo { Name = "Jane Doe" },
        GeneratedAt = Now
    };

    private sealed class StubExporter(
        ExportFormat format,
        byte[] content,
        string contentType) : IResumeExporter
    {
        public ExportFormat Format { get; } = format;

        public string ContentType { get; } = contentType;

        public Exception? Failure { get; init; }

        public int ExportCount { get; private set; }

        public byte[] Export(GeneratedResume resume)
        {
            ExportCount++;
            if (Failure is not null)
            {
                throw Failure;
            }

            return content;
        }
    }
}
