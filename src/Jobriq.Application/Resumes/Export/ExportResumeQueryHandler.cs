using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Common.Mapping;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Contracts;
using Jobriq.Domain.Resumes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Resumes.Export;

internal sealed class ExportResumeQueryHandler(
    IEnumerable<IResumeExporter> exporters,
    TimeProvider timeProvider)
    : IQueryHandler<ExportResumeQuery, ExportedFile>
{
    public Task<Result<ExportedFile>> Handle(
        ExportResumeQuery query,
        CancellationToken cancellationToken)
    {
        ExportFormat format = EnumMappings.Map<ExportFormatDto, ExportFormat>(query.Format);

        IResumeExporter exporter = exporters.FirstOrDefault(candidate => candidate.Format == format)
            ?? throw new ArgumentOutOfRangeException(nameof(query), format, "Unsupported export format.");

        GeneratedResume resume = ResumeMappings.ToDomain(query.Resume!);

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

        return Task.FromResult<Result<ExportedFile>>(
            new ExportedFile(content, $"{baseName}.{extension}", exporter.ContentType));
    }
}
