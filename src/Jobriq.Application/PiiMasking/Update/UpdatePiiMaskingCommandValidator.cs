using FluentValidation;

namespace Jobriq.Application.PiiMasking.Update;

internal sealed class UpdatePiiMaskingCommandValidator : AbstractValidator<UpdatePiiMaskingCommand>
{
    public UpdatePiiMaskingCommandValidator()
    {
        RuleFor(command => command.Enabled)
            .NotNull()
            .WithMessage("Choose whether to redact personal details.");
    }
}
