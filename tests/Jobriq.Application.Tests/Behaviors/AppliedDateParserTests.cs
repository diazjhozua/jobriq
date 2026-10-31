using Jobriq.Application.Common.Dates;
using Shouldly;

namespace Jobriq.Application.Tests.Behaviors;

public sealed class AppliedDateParserTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void EmptyInput_IsValidAndNull(string? raw)
    {
        bool parsed = AppliedDateParser.TryParse(raw, out DateOnly? appliedDate);

        parsed.ShouldBeTrue();
        appliedDate.ShouldBeNull();
    }

    [Fact]
    public void IsoDate_IsParsed()
    {
        bool parsed = AppliedDateParser.TryParse("2022-08-01", out DateOnly? appliedDate);

        parsed.ShouldBeTrue();
        appliedDate.ShouldBe(new DateOnly(2022, 8, 1));
    }

    [Theory]
    [InlineData("August 2022")]
    [InlineData("2022-8-1")]
    [InlineData("01/08/2022")]
    public void NonIsoInput_IsRejected(string raw)
    {
        bool parsed = AppliedDateParser.TryParse(raw, out DateOnly? appliedDate);

        parsed.ShouldBeFalse();
        appliedDate.ShouldBeNull();
    }
}
