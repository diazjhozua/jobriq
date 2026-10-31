using FluentValidation;

namespace Jobriq.Application.CoverLetters.Export;

internal sealed class ExportCoverLetterQueryValidator : AbstractValidator<ExportCoverLetterQuery>
{
    public ExportCoverLetterQueryValidator()
    {
        ClassLevelCascadeMode = CascadeMode.Stop;

        RuleFor(query => query.Letter)
            .NotNull()
            .WithMessage("A cover letter is required.");

        RuleFor(query => query.Letter)
            .Must(letter => letter is not null &&
                            letter.Personal is not null &&
                            !string.IsNullOrWhiteSpace(letter.Personal.Name) &&
                            letter.Paragraphs is not null)
            .WithMessage("The cover letter is missing required content.");
    }
}
