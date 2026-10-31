using FluentValidation;

namespace Jobriq.Application.Resumes.Export;

internal sealed class ExportResumeQueryValidator : AbstractValidator<ExportResumeQuery>
{
    public ExportResumeQueryValidator()
    {
        RuleFor(query => query.Resume)
            .NotNull()
            .WithMessage("A generated resume is required.");
    }
}
