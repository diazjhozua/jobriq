using FluentValidation.Results;
using Jobriq.Application.ResumeThemes;
using Jobriq.Application.ResumeThemes.Create;
using Jobriq.Application.ResumeThemes.Update;
using Jobriq.Contracts;
using Shouldly;

namespace Jobriq.Application.Tests.Validators;

public sealed class ResumeThemeValidatorTests
{
    [Fact]
    public void Create_ValidCommand_Passes()
    {
        new CreateResumeThemeCommandValidator()
            .Validate(new CreateResumeThemeCommand("My theme", Styles()))
            .IsValid.ShouldBeTrue();
    }

    [Fact]
    public void Create_WithoutStyles_Fails()
    {
        ValidationResult result = new CreateResumeThemeCommandValidator()
            .Validate(new CreateResumeThemeCommand("My theme", null));

        result.Errors.ShouldContain(error => error.ErrorMessage == "Theme styles are required.");
    }

    [Fact]
    public void Update_WithoutName_Fails()
    {
        ValidationResult result = new UpdateResumeThemeCommandValidator()
            .Validate(new UpdateResumeThemeCommand(Guid.NewGuid(), " ", Styles()));

        result.Errors.ShouldContain(error => error.ErrorMessage == "A theme name is required.");
    }

    [Fact]
    public void Styles_UnsupportedFont_Fails()
    {
        ResumeThemeStylesDto styles = Styles();
        styles.NameFont = "Comic Sans MS";

        ValidationResult result = new ResumeThemeStylesValidator().Validate(styles);

        result.Errors.ShouldContain(
            error => error.ErrorMessage == "Choose a supported name font.");
    }

    [Fact]
    public void Styles_MalformedColor_Fails()
    {
        ResumeThemeStylesDto styles = Styles();
        styles.TextColor = "dark";

        ValidationResult result = new ResumeThemeStylesValidator().Validate(styles);

        result.Errors.ShouldContain(
            error => error.ErrorMessage == "Text color must be a #RRGGBB value.");
    }

    [Fact]
    public void Styles_OutOfRangeSizes_Fail()
    {
        ResumeThemeStylesDto styles = Styles();
        styles.BodySize = 7;
        styles.PageMargin = 120;

        ValidationResult result = new ResumeThemeStylesValidator().Validate(styles);

        result.Errors.ShouldContain(error =>
            error.ErrorMessage == "Body size must be between 8 and 14 points.");
        result.Errors.ShouldContain(error =>
            error.ErrorMessage == "Page margin must be between 36 and 90 points.");
    }

    private static ResumeThemeStylesDto Styles() => new()
    {
        NameFont = "Georgia",
        BodyFont = "Georgia",
        TextColor = "#222222",
        MutedColor = "#666666",
        HeadingColor = "#1F3A5F",
        RuleColor = "#C9B99A",
        BodySize = 11,
        SmallSize = 10,
        HeadingSize = 13,
        NameSize = 20,
        PageMargin = 72,
        ShowRules = true
    };
}
