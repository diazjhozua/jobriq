using Jobriq.Domain.ResumeThemes;
using Shouldly;

namespace Jobriq.Domain.Tests.ResumeThemes;

public sealed class ResumeThemeStylesTests
{
    [Fact]
    public void Constructor_NormalizesFontsAndColors()
    {
        ResumeThemeStyles styles = CreateStyles(nameFont: "  calibri ", textColor: "1a2b3c");

        styles.NameFont.ShouldBe("Calibri");
        styles.TextColor.ShouldBe("#1A2B3C");
    }

    [Fact]
    public void Constructor_RejectsUnsupportedFont()
    {
        Should.Throw<ArgumentException>(() => CreateStyles(bodyFont: "Comic Sans MS"));
    }

    [Fact]
    public void Constructor_RejectsMalformedColor()
    {
        Should.Throw<ArgumentException>(() => CreateStyles(mutedColor: "red"));
        Should.Throw<ArgumentException>(() => CreateStyles(ruleColor: "#12345"));
    }

    [Theory]
    [InlineData(7)]
    [InlineData(15)]
    public void Constructor_RejectsOutOfRangeBodySize(int size)
    {
        Should.Throw<ArgumentException>(() => CreateStyles(bodySize: size));
    }

    [Fact]
    public void Constructor_RejectsOutOfRangePageMargin()
    {
        Should.Throw<ArgumentException>(() => CreateStyles(pageMargin: 120));
    }

    internal static ResumeThemeStyles CreateStyles(
        string nameFont = "Calibri",
        string bodyFont = "Calibri",
        string textColor = "#1A1A1A",
        string mutedColor = "#666666",
        string headingColor = "#1A1A1A",
        string ruleColor = "#CCCCCC",
        int bodySize = 11,
        int smallSize = 10,
        int headingSize = 13,
        int nameSize = 18,
        int pageMargin = 72,
        bool showRules = true) =>
        new(
            nameFont,
            bodyFont,
            textColor,
            mutedColor,
            headingColor,
            ruleColor,
            bodySize,
            smallSize,
            headingSize,
            nameSize,
            pageMargin,
            showRules);
}

public sealed class ResumeThemeCatalogTests
{
    [Fact]
    public void BuiltIns_AreFiveDistinctReadOnlyThemes()
    {
        ResumeThemeCatalog.BuiltIns.Count.ShouldBe(5);
        ResumeThemeCatalog.BuiltIns.Select(theme => theme.Id).Distinct().Count().ShouldBe(5);
        ResumeThemeCatalog.BuiltIns.ShouldAllBe(theme => theme.IsBuiltIn);
    }

    [Fact]
    public void Default_IsClassic()
    {
        ResumeThemeCatalog.Default.ShouldBe(ResumeThemeCatalog.Classic);
        ResumeThemeCatalog.Default.Styles.NameFont.ShouldBe("Calibri");
    }

    [Fact]
    public void Monochrome_DisablesRules()
    {
        ResumeThemeCatalog.Monochrome.Styles.ShowRules.ShouldBeFalse();
    }

    [Theory]
    [InlineData("classic")]
    [InlineData("  MODERN ")]
    public void ReservedNames_MatchBuiltInsCaseInsensitively(string name)
    {
        ResumeThemeCatalog.IsReservedName(name).ShouldBeTrue();
    }

    [Fact]
    public void Find_ReturnsNullForUnknownId()
    {
        ResumeThemeCatalog.Find(Guid.NewGuid()).ShouldBeNull();
        ResumeThemeCatalog.IsBuiltIn(Guid.NewGuid()).ShouldBeFalse();
    }
}

public sealed class ResumeThemeTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 2, 3, 4, 5, TimeSpan.Zero);

    [Fact]
    public void Create_TrimsNameAndStampsTimestamps()
    {
        ResumeTheme theme = ResumeTheme.Create(
            "  My theme ",
            ResumeThemeStylesTests.CreateStyles(),
            Now);

        theme.Name.ShouldBe("My theme");
        theme.CreatedAt.ShouldBe(Now);
        theme.UpdatedAt.ShouldBe(Now);
        theme.ToDefinition().Id.ShouldBe(theme.Id);
    }

    [Fact]
    public void Create_RejectsBlankName()
    {
        Should.Throw<ArgumentException>(() =>
            ResumeTheme.Create(" ", ResumeThemeStylesTests.CreateStyles(), Now));
    }

    [Fact]
    public void Create_RejectsOverlongName()
    {
        string name = new('x', ResumeThemeLimits.NameMaxLength + 1);

        Should.Throw<ArgumentException>(() =>
            ResumeTheme.Create(name, ResumeThemeStylesTests.CreateStyles(), Now));
    }

    [Fact]
    public void UpdateDetails_ChangesNameStylesAndUpdatedAt()
    {
        ResumeTheme theme = ResumeTheme.Create(
            "My theme",
            ResumeThemeStylesTests.CreateStyles(),
            Now);
        DateTimeOffset later = Now.AddHours(1);

        theme.UpdateDetails(
            "Renamed",
            ResumeThemeStylesTests.CreateStyles(bodyFont: "Georgia"),
            later);

        theme.Name.ShouldBe("Renamed");
        theme.Styles.BodyFont.ShouldBe("Georgia");
        theme.UpdatedAt.ShouldBe(later);
        theme.CreatedAt.ShouldBe(Now);
    }

    [Fact]
    public void Restore_KeepsIdAndTimestamps()
    {
        Guid id = Guid.NewGuid();

        ResumeTheme theme = ResumeTheme.Restore(
            id,
            "My theme",
            ResumeThemeStylesTests.CreateStyles(),
            Now,
            Now.AddDays(1));

        theme.Id.ShouldBe(id);
        theme.CreatedAt.ShouldBe(Now);
        theme.UpdatedAt.ShouldBe(Now.AddDays(1));
    }
}

public sealed class ResumeThemeSettingsTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 2, 3, 4, 5, TimeSpan.Zero);

    [Fact]
    public void Empty_ResolvesClassic()
    {
        ResumeThemeSettings.Empty.ResolveActiveDefinition()
            .ShouldBe(ResumeThemeCatalog.Classic);
        ResumeThemeSettings.Empty.EffectiveActiveThemeId
            .ShouldBe(ResumeThemeCatalog.ClassicId);
    }

    [Fact]
    public void ActiveCustomTheme_ResolvesItsDefinition()
    {
        ResumeTheme theme = ResumeTheme.Create(
            "My theme",
            ResumeThemeStylesTests.CreateStyles(),
            Now);

        ResumeThemeDefinition definition =
            new ResumeThemeSettings([theme], theme.Id).ResolveActiveDefinition();

        definition.Id.ShouldBe(theme.Id);
        definition.Name.ShouldBe("My theme");
        definition.IsBuiltIn.ShouldBeFalse();
    }

    [Fact]
    public void ActiveBuiltInTheme_ResolvesFromCatalog()
    {
        ResumeThemeSettings settings = new([], ResumeThemeCatalog.ModernId);

        settings.ResolveActiveDefinition().ShouldBe(ResumeThemeCatalog.Modern);
        settings.EffectiveActiveThemeId.ShouldBe(ResumeThemeCatalog.ModernId);
    }

    [Fact]
    public void StaleActiveId_FallsBackToClassic()
    {
        ResumeTheme theme = ResumeTheme.Create(
            "My theme",
            ResumeThemeStylesTests.CreateStyles(),
            Now);

        ResumeThemeSettings settings = new([theme], Guid.NewGuid());

        settings.ResolveActiveDefinition().ShouldBe(ResumeThemeCatalog.Classic);
    }
}
