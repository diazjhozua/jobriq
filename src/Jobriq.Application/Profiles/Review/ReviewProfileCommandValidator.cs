using FluentValidation;
using Jobriq.Application.Common.Validation;

namespace Jobriq.Application.Profiles.Review;

internal sealed class ReviewProfileCommandValidator : AbstractValidator<ReviewProfileCommand>
{
    public ReviewProfileCommandValidator()
    {
        RuleFor(command => command.Profile)
            .Must(ProfileRules.HasValidCollections)
            .WithMessage("A complete profile is required.");
    }
}
