using Jobriq.Domain.PiiMasking;
using Jobriq.Domain.Resumes;
using Jobriq.Domain.State;
using Shouldly;

namespace Jobriq.Domain.Tests.PiiMasking;

public sealed class PiiMaskingSettingsTests
{
    [Fact]
    public void Default_IsEnabled()
    {
        PiiMaskingSettings.Default.Enabled.ShouldBeTrue();
    }

    [Fact]
    public void State_DefaultsToEnabled()
    {
        JobriqState state = new(new ResumeProfile(), []);

        state.PiiMasking.ShouldBe(PiiMaskingSettings.Default);
        state.PiiMasking.Enabled.ShouldBeTrue();
    }

    [Fact]
    public void State_CarriesAnExplicitSetting()
    {
        JobriqState state = new(
            new ResumeProfile(),
            [],
            piiMasking: new PiiMaskingSettings(false));

        state.PiiMasking.Enabled.ShouldBeFalse();
    }
}
