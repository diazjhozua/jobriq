using FluentValidation;
using Jobriq.Contracts;
using Jobriq.Domain.ResumeThemes;

namespace Jobriq.Application.ResumeThemes;

internal sealed class ResumeThemeStylesValidator : AbstractValidator<ResumeThemeStylesDto>
{
    private const string ColorPattern = "^#?[0-9A-Fa-f]{6}$";

    public ResumeThemeStylesValidator()
    {
        RuleFor(styles => styles.NameFont)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .WithMessage("A name font is required.")
            .Must(font => !string.IsNullOrWhiteSpace(font) && ResumeThemeFonts.IsSupported(font))
            .WithMessage("Choose a supported name font.");

        RuleFor(styles => styles.BodyFont)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .WithMessage("A body font is required.")
            .Must(font => !string.IsNullOrWhiteSpace(font) && ResumeThemeFonts.IsSupported(font))
            .WithMessage("Choose a supported body font.");

        RuleFor(styles => styles.TextColor)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .WithMessage("A text color is required.")
            .Matches(ColorPattern)
            .WithMessage("Text color must be a #RRGGBB value.");

        RuleFor(styles => styles.MutedColor)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .WithMessage("A muted color is required.")
            .Matches(ColorPattern)
            .WithMessage("Muted color must be a #RRGGBB value.");

        RuleFor(styles => styles.HeadingColor)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .WithMessage("A heading color is required.")
            .Matches(ColorPattern)
            .WithMessage("Heading color must be a #RRGGBB value.");

        RuleFor(styles => styles.RuleColor)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .WithMessage("A rule color is required.")
            .Matches(ColorPattern)
            .WithMessage("Rule color must be a #RRGGBB value.");

        RuleFor(styles => styles.BodySize)
            .Cascade(CascadeMode.Stop)
            .NotNull()
            .WithMessage("A body size is required.")
            .Must(size => size is >= ResumeThemeLimits.BodySizeMin and <= ResumeThemeLimits.BodySizeMax)
            .WithMessage(
                $"Body size must be between {ResumeThemeLimits.BodySizeMin} and {ResumeThemeLimits.BodySizeMax} points.");

        RuleFor(styles => styles.SmallSize)
            .Cascade(CascadeMode.Stop)
            .NotNull()
            .WithMessage("A small size is required.")
            .Must(size => size is >= ResumeThemeLimits.SmallSizeMin and <= ResumeThemeLimits.SmallSizeMax)
            .WithMessage(
                $"Small size must be between {ResumeThemeLimits.SmallSizeMin} and {ResumeThemeLimits.SmallSizeMax} points.");

        RuleFor(styles => styles.HeadingSize)
            .Cascade(CascadeMode.Stop)
            .NotNull()
            .WithMessage("A heading size is required.")
            .Must(size => size is >= ResumeThemeLimits.HeadingSizeMin and <= ResumeThemeLimits.HeadingSizeMax)
            .WithMessage(
                $"Heading size must be between {ResumeThemeLimits.HeadingSizeMin} and {ResumeThemeLimits.HeadingSizeMax} points.");

        RuleFor(styles => styles.NameSize)
            .Cascade(CascadeMode.Stop)
            .NotNull()
            .WithMessage("A name size is required.")
            .Must(size => size is >= ResumeThemeLimits.NameSizeMin and <= ResumeThemeLimits.NameSizeMax)
            .WithMessage(
                $"Name size must be between {ResumeThemeLimits.NameSizeMin} and {ResumeThemeLimits.NameSizeMax} points.");

        RuleFor(styles => styles.PageMargin)
            .Cascade(CascadeMode.Stop)
            .NotNull()
            .WithMessage("A page margin is required.")
            .Must(margin => margin is >= ResumeThemeLimits.PageMarginMin and <= ResumeThemeLimits.PageMarginMax)
            .WithMessage(
                $"Page margin must be between {ResumeThemeLimits.PageMarginMin} and {ResumeThemeLimits.PageMarginMax} points.");

        RuleFor(styles => styles.ShowRules)
            .NotNull()
            .WithMessage("Choose whether section rules are shown.");
    }
}
