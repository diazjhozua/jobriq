using FluentValidation;

namespace Jobriq.Application.Resumes.Generate;

internal sealed class GenerateResumeCommandValidator : AbstractValidator<GenerateResumeCommand>
{
    public GenerateResumeCommandValidator()
    {
        RuleFor(command => command.Profile)
            .NotNull()
            .WithMessage("A profile is required.");
    }
}
