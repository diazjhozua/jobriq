using Jobriq.Application.Resumes.ExportResume;
using Shouldly;

namespace Jobriq.Application.Tests.UseCases;

public sealed class ResumeFileNameTests
{
    [Theory]
    [InlineData("Jane Doe", "jane-doe-resume-20261024-123456")]
    [InlineData("  Jane   Doe  ", "jane-doe-resume-20261024-123456")]
    [InlineData("Jane O'Doe", "jane-odoe-resume-20261024-123456")]
    [InlineData("", "resume-20261024-123456")]
    [InlineData("!!!", "resume-20261024-123456")]
    public void Create_ProducesCliCompatibleName(string name, string expected)
    {
        DateTimeOffset time = new(2026, 10, 24, 12, 34, 56, TimeSpan.Zero);

        ResumeFileName.Create(name, time).ShouldBe(expected);
    }

    [Theory]
    [InlineData("Jane Doe", "jane-doe-cover-letter-20261024-123456")]
    [InlineData("", "cover-letter-20261024-123456")]
    public void Create_UsesDocumentLabel(string name, string expected)
    {
        DateTimeOffset time = new(2026, 10, 24, 12, 34, 56, TimeSpan.Zero);

        ResumeFileName.Create(name, time, "cover-letter").ShouldBe(expected);
    }
}
