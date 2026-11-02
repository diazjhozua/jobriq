using FluentValidation;
using Jobriq.Domain.ResumeThemes;

namespace Jobriq.Application.ResumeThemes.Create;

internal sealed class CreateResumeThemeCommandValidator : AbstractValidator<CreateResumeThemeCommand>
{
    public CreateResumeThemeCommandValidator()
    {
        RuleFor(command => command.Name)
            .NotEmpty()
            .WithMessage("A theme name is required.")
            .MaximumLength(ResumeThemeLimits.NameMaxLength)
            .WithMessage($"A theme name cannot exceed {ResumeThemeLimits.NameMaxLength} characters.");

        RuleFor(command => command.Styles)
            .NotNull()
            .WithMessage("Theme styles are required.");

        RuleFor(command => command.Styles!)
            .SetValidator(new ResumeThemeStylesValidator())
            .When(command => command.Styles is not null);
    }
}
