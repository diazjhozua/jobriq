using FluentValidation;
using Jobriq.Application.Common.Validation;

namespace Jobriq.Application.Profiles.Save;

internal sealed class SaveProfileCommandValidator : AbstractValidator<SaveProfileCommand>
{
    public SaveProfileCommandValidator()
    {
        RuleFor(command => command.Profile)
            .Must(ProfileRules.HasValidCollections)
            .WithMessage("A complete profile is required.");
    }
}
