using FluentValidation;
using Jobriq.Domain.PromptStyles;

namespace Jobriq.Application.PromptStyles.Create;

internal sealed class CreatePromptStyleCommandValidator : AbstractValidator<CreatePromptStyleCommand>
{
    public CreatePromptStyleCommandValidator()
    {
        ClassLevelCascadeMode = CascadeMode.Stop;

        RuleFor(command => command.Name)
            .NotEmpty()
            .WithMessage("A style name is required.")
            .MaximumLength(PromptStyleLimits.NameMaxLength)
            .WithMessage($"A style name cannot exceed {PromptStyleLimits.NameMaxLength} characters.");

        RuleFor(command => command.Instructions)
            .NotEmpty()
            .WithMessage("Style instructions are required.")
            .MaximumLength(PromptStyleLimits.InstructionsMaxLength)
            .WithMessage(
                $"Style instructions cannot exceed {PromptStyleLimits.InstructionsMaxLength} characters.");
    }
}
