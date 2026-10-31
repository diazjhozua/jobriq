using FluentValidation;

namespace Jobriq.Application.Applications.SaveGeneratedResume;

internal sealed class SaveGeneratedResumeCommandValidator
    : AbstractValidator<SaveGeneratedResumeCommand>
{
    public SaveGeneratedResumeCommandValidator()
    {
        RuleFor(command => command.Resume)
            .NotNull()
            .WithMessage("A generated resume is required.");
    }
}
