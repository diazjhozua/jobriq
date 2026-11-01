using FluentValidation;

namespace Jobriq.Application.PromptStyles.Delete;

internal sealed class DeletePromptStyleCommandValidator : AbstractValidator<DeletePromptStyleCommand>
{
    public DeletePromptStyleCommandValidator()
    {
        RuleFor(command => command.PromptStyleId)
            .NotEmpty()
            .WithMessage("A prompt style is required.");
    }
}
