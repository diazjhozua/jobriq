using FluentValidation;

namespace Jobriq.Application.PromptStyles.Activate;

internal sealed class ActivatePromptStyleCommandValidator
    : AbstractValidator<ActivatePromptStyleCommand>
{
    public ActivatePromptStyleCommandValidator()
    {
        RuleFor(command => command.PromptStyleId)
            .NotEmpty()
            .WithMessage("A prompt style is required.");
    }
}
