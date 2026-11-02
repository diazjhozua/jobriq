using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.ResumeThemes;
using Jobriq.Application.Common.Mapping;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Domain.Applications;
using Jobriq.Domain.ResumeThemes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.CoverLetters.Export;

internal sealed class ExportCoverLetterQueryHandler(
    ICoverLetterExporter exporter,
    IResumeThemeResolver resumeThemeResolver,
    TimeProvider timeProvider)
    : IQueryHandler<ExportCoverLetterQuery, ExportedFile>
{
    public async Task<Result<ExportedFile>> Handle(
        ExportCoverLetterQuery query,
        CancellationToken cancellationToken)
    {
        CoverLetter letter = CoverLetterMappings.ToDomain(query.Letter!);

        ResumeThemeDefinition theme = await resumeThemeResolver.ResolveAsync(cancellationToken);

        byte[] content;
        try
        {
            content = exporter.Export(letter, theme);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            throw new ExportFailedException("The cover letter could not be exported.", exception);
        }

        string baseName = ResumeFileName.Create(
            letter.Personal.Name,
            timeProvider.GetLocalNow(),
            "cover-letter");

        return new ExportedFile(content, $"{baseName}{exporter.FileExtension}", exporter.ContentType);
    }
}
