using Jobriq.Application.Abstractions;
using Jobriq.Domain.Resumes;

namespace Jobriq.Application.Resumes.ExportResume;

public sealed class ExportResumeUseCase(IEnumerable<IResumeExporter> exporters, TimeProvider timeProvider)
{
    public ExportedFile Execute(GeneratedResume resume, ExportFormat format)
    {
        IResumeExporter exporter = exporters.FirstOrDefault(candidate => candidate.Format == format)
            ?? throw new ArgumentOutOfRangeException(nameof(format), format, "Unsupported export format.");

        byte[] content;
        try
        {
            content = exporter.Export(resume);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            throw new ExportFailedException("The resume could not be exported.", exception);
        }

        string baseName = ResumeFileName.Create(resume.Personal.Name, timeProvider.GetLocalNow());
        string extension = format == ExportFormat.Docx ? "docx" : "md";

        return new ExportedFile(content, $"{baseName}.{extension}", exporter.ContentType);
    }
}
