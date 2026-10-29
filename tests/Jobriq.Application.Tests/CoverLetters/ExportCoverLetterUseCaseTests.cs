using Jobriq.Application.Abstractions;
using Jobriq.Application.CoverLetters.ExportCoverLetter;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;
using Shouldly;

namespace Jobriq.Application.Tests.CoverLetters;

public sealed class ExportCoverLetterUseCaseTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 24, 12, 34, 56, TimeSpan.Zero);

    [Fact]
    public void Execute_ExportsLetterWithTimestampedName()
    {
        StubExporter exporter = new([1, 2, 3], "test/content");
        ExportCoverLetterUseCase useCase = new(exporter, new TestTimeProvider(Now));

        ExportedFile file = useCase.Execute(CreateLetter());

        file.Content.ShouldBe([1, 2, 3]);
        file.ContentType.ShouldBe("test/content");
        file.FileName.ShouldBe("jane-doe-cover-letter-20261024-123456.docx");
        exporter.ExportCount.ShouldBe(1);
    }

    [Fact]
    public void Execute_RejectsNullLetter()
    {
        ExportCoverLetterUseCase useCase = new(new StubExporter([], "test/content"), new TestTimeProvider(Now));

        Should.Throw<ArgumentNullException>(() => useCase.Execute(null!));
    }

    [Fact]
    public void Execute_WrapsExporterFailures()
    {
        StubExporter exporter = new([], "test/content")
        {
            Failure = new InvalidOperationException("boom")
        };
        ExportCoverLetterUseCase useCase = new(exporter, new TestTimeProvider(Now));

        ExportFailedException exception = Should.Throw<ExportFailedException>(
            () => useCase.Execute(CreateLetter()));

        exception.InnerException.ShouldBe(exporter.Failure);
    }

    private static CoverLetter CreateLetter() => new()
    {
        Personal = new PersonalInfo { Name = "Jane Doe" },
        Company = "Acme",
        Role = "Engineer",
        Salutation = "Dear Acme Hiring Team,",
        Paragraphs = ["First paragraph."],
        Closing = "Sincerely,",
        Signature = "Jane Doe",
        GeneratedAt = Now
    };

    private sealed class StubExporter(byte[] content, string contentType) : ICoverLetterExporter
    {
        public string ContentType { get; } = contentType;

        public string FileExtension => ".docx";

        public Exception? Failure { get; init; }

        public int ExportCount { get; private set; }

        public byte[] Export(CoverLetter letter)
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
