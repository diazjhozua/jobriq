using Jobriq.Domain.PromptStyles;
using Shouldly;

namespace Jobriq.Domain.Tests.PromptStyles;

public sealed class PromptStyleTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 2, 3, 4, 5, TimeSpan.Zero);

    [Fact]
    public void Create_TrimsNameAndInstructions()
    {
        PromptStyle style = PromptStyle.Create("  Warm voice  ", "  Be warm.  ", Now);

        style.Name.ShouldBe("Warm voice");
        style.Instructions.ShouldBe("Be warm.");
        style.IsActive.ShouldBeFalse();
        style.CreatedAt.ShouldBe(Now);
        style.UpdatedAt.ShouldBe(Now);
    }

    [Fact]
    public void Create_RejectsBlankName()
    {
        Should.Throw<ArgumentException>(() => PromptStyle.Create(" ", "Be warm.", Now));
    }

    [Fact]
    public void Create_RejectsBlankInstructions()
    {
        Should.Throw<ArgumentException>(() => PromptStyle.Create("Warm voice", " ", Now));
    }

    [Fact]
    public void Create_RejectsOverlongName()
    {
        string name = new('a', PromptStyleLimits.NameMaxLength + 1);

        Should.Throw<ArgumentException>(() => PromptStyle.Create(name, "Be warm.", Now));
    }

    [Fact]
    public void Create_RejectsOverlongInstructions()
    {
        string instructions = new('a', PromptStyleLimits.InstructionsMaxLength + 1);

        Should.Throw<ArgumentException>(() => PromptStyle.Create("Warm voice", instructions, Now));
    }

    [Fact]
    public void UpdateDetails_ChangesNameAndInstructions()
    {
        PromptStyle style = PromptStyle.Create("Warm voice", "Be warm.", Now);
        DateTimeOffset later = Now.AddHours(1);

        style.UpdateDetails("Concise voice", "Be brief.", later);

        style.Name.ShouldBe("Concise voice");
        style.Instructions.ShouldBe("Be brief.");
        style.UpdatedAt.ShouldBe(later);
    }

    [Fact]
    public void Restore_CarriesStoredValues()
    {
        Guid id = Guid.NewGuid();
        DateTimeOffset created = Now.AddDays(-2);

        PromptStyle style = PromptStyle.Restore(id, "Warm voice", "Be warm.", true, created, Now);

        style.Id.ShouldBe(id);
        style.Name.ShouldBe("Warm voice");
        style.Instructions.ShouldBe("Be warm.");
        style.IsActive.ShouldBeTrue();
        style.CreatedAt.ShouldBe(created);
        style.UpdatedAt.ShouldBe(Now);
    }

    [Fact]
    public void ActivateAndDeactivate_ToggleFlag()
    {
        PromptStyle style = PromptStyle.Create("Warm voice", "Be warm.", Now);

        style.Activate();
        style.IsActive.ShouldBeTrue();

        style.Deactivate();
        style.IsActive.ShouldBeFalse();
    }

    [Fact]
    public void ToDefinition_CarriesIdentityAndText()
    {
        PromptStyle style = PromptStyle.Create("Warm voice", "Be warm.", Now);

        PromptStyleDefinition definition = style.ToDefinition();

        definition.Id.ShouldBe(style.Id);
        definition.Name.ShouldBe("Warm voice");
        definition.Instructions.ShouldBe("Be warm.");
        definition.IsBuiltIn.ShouldBeFalse();
    }
}
