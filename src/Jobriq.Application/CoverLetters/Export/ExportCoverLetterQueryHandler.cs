using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Common.Mapping;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Domain.Applications;
using Jobriq.SharedKernel;

namespace Jobriq.Application.CoverLetters.Export;

internal sealed class ExportCoverLetterQueryHandler(
    ICoverLetterExporter exporter,
    TimeProvider timeProvider)
    : IQueryHandler<ExportCoverLetterQuery, ExportedFile>
{
    public Task<Result<ExportedFile>> Handle(
        ExportCoverLetterQuery query,
        CancellationToken cancellationToken)
    {
        CoverLetter letter = CoverLetterMappings.ToDomain(query.Letter!);

        byte[] content;
        try
        {
            content = exporter.Export(letter);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            throw new ExportFailedException("The cover letter could not be exported.", exception);
        }

        string baseName = ResumeFileName.Create(
            letter.Personal.Name,
            timeProvider.GetLocalNow(),
            "cover-letter");

        return Task.FromResult<Result<ExportedFile>>(
            new ExportedFile(content, $"{baseName}{exporter.FileExtension}", exporter.ContentType));
    }
}
