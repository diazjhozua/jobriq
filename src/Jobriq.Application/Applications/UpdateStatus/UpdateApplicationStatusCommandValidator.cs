using FluentValidation;

namespace Jobriq.Application.Applications.UpdateStatus;

internal sealed class UpdateApplicationStatusCommandValidator
    : AbstractValidator<UpdateApplicationStatusCommand>
{
    public UpdateApplicationStatusCommandValidator()
    {
        ClassLevelCascadeMode = CascadeMode.Stop;

        RuleFor(command => command.Status)
            .NotNull()
            .WithMessage("A status is required.");

        RuleFor(command => command.Status)
            .Must(status => status is null || Enum.IsDefined(status.Value))
            .WithMessage("Unknown application status.");
    }
}
