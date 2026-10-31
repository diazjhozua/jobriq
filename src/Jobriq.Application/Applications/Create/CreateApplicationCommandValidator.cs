using FluentValidation;
using Jobriq.Application.Common.Dates;

namespace Jobriq.Application.Applications.Create;

internal sealed class CreateApplicationCommandValidator : AbstractValidator<CreateApplicationCommand>
{
    public CreateApplicationCommandValidator()
    {
        ClassLevelCascadeMode = CascadeMode.Stop;

        RuleFor(command => command.Company)
            .Must(company => !string.IsNullOrWhiteSpace(company))
            .WithMessage("Company and role are required.");

        RuleFor(command => command.Role)
            .Must(role => !string.IsNullOrWhiteSpace(role))
            .WithMessage("Company and role are required.");

        RuleFor(command => command.Status)
            .Must(status => status is null || Enum.IsDefined(status.Value))
            .WithMessage("Unknown application status.");

        RuleFor(command => command.AppliedDate)
            .Must(raw => AppliedDateParser.TryParse(raw, out _))
            .WithMessage("Date applied must be a valid date.");
    }
}
