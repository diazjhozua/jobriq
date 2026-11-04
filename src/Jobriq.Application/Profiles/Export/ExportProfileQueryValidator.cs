using FluentValidation;
using Jobriq.Application.Common.Validation;

namespace Jobriq.Application.Profiles.Export;

internal sealed class ExportProfileQueryValidator : AbstractValidator<ExportProfileQuery>
{
    public ExportProfileQueryValidator()
    {
        RuleFor(query => query.Profile)
            .Must(ProfileRules.HasValidCollections)
            .WithMessage("A complete profile is required.");
    }
}
