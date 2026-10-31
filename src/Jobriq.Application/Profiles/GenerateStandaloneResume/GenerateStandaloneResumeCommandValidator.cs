using FluentValidation;
using Jobriq.Application.Common.Validation;

namespace Jobriq.Application.Profiles.GenerateStandaloneResume;

internal sealed class GenerateStandaloneResumeCommandValidator
    : AbstractValidator<GenerateStandaloneResumeCommand>
{
    public GenerateStandaloneResumeCommandValidator()
    {
        RuleFor(command => command.Profile)
            .Must(ProfileRules.HasValidCollections)
            .WithMessage("A complete profile is required.");
    }
}
