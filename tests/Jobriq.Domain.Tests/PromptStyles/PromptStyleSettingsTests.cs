using Jobriq.Domain.PromptStyles;
using Shouldly;

namespace Jobriq.Domain.Tests.PromptStyles;

public sealed class PromptStyleSettingsTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 2, 3, 4, 5, TimeSpan.Zero);

    [Fact]
    public void Empty_ResolvesBuiltInDefinition()
    {
        PromptStyleSettings settings = PromptStyleSettings.Empty;

        settings.Styles.ShouldBeEmpty();
        settings.ActiveStyleId.ShouldBeNull();
        settings.ResolveActiveDefinition().ShouldBe(PromptStyleDefinition.BuiltIn);
    }

    [Fact]
    public void ActiveDefinition_ReturnsActiveStyle()
    {
        PromptStyle style = PromptStyle.Create("Warm voice", "Be warm.", Now);

        PromptStyleSettings settings = new([style], style.Id);

        settings.ResolveActiveDefinition().Id.ShouldBe(style.Id);
        settings.ResolveActiveDefinition().Instructions.ShouldBe("Be warm.");
    }

    [Fact]
    public void ActiveDefinition_FallsBackToBuiltInWhenActiveIdIsMissing()
    {
        PromptStyle style = PromptStyle.Create("Warm voice", "Be warm.", Now);

        PromptStyleSettings settings = new([style], Guid.NewGuid());

        settings.ResolveActiveDefinition().ShouldBe(PromptStyleDefinition.BuiltIn);
    }

    [Fact]
    public void BuiltInDefinition_IsMarkedAndFixed()
    {
        PromptStyleDefinition builtIn = PromptStyleDefinition.BuiltIn;

        builtIn.IsBuiltIn.ShouldBeTrue();
        builtIn.Id.ShouldBe(PromptStyleCatalog.BuiltInId);
        builtIn.Name.ShouldBe(PromptStyleCatalog.BuiltInName);
        builtIn.Instructions.ShouldBe(PromptStyleCatalog.BuiltInInstructions);
    }
}
