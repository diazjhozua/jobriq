using Jobriq.Application.Abstractions;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Domain.Applications;

namespace Jobriq.Application.CoverLetters.ExportCoverLetter;

public sealed class ExportCoverLetterUseCase(ICoverLetterExporter exporter, TimeProvider timeProvider)
{
    public ExportedFile Execute(CoverLetter letter)
    {
        ArgumentNullException.ThrowIfNull(letter);

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

        return new ExportedFile(content, $"{baseName}{exporter.FileExtension}", exporter.ContentType);
    }
}
