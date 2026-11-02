using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.ResumeThemes;
using Jobriq.Application.Common.Mapping;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Contracts;
using Jobriq.Domain.ResumeThemes;
using Jobriq.Domain.Resumes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Resumes.Export;

internal sealed class ExportResumeQueryHandler(
    IEnumerable<IResumeExporter> exporters,
    IResumeThemeResolver resumeThemeResolver,
    TimeProvider timeProvider)
    : IQueryHandler<ExportResumeQuery, ExportedFile>
{
    public async Task<Result<ExportedFile>> Handle(
        ExportResumeQuery query,
        CancellationToken cancellationToken)
    {
        ExportFormat format = EnumMappings.Map<ExportFormatDto, ExportFormat>(query.Format);

        IResumeExporter exporter = exporters.FirstOrDefault(candidate => candidate.Format == format)
            ?? throw new ArgumentOutOfRangeException(nameof(query), format, "Unsupported export format.");

        GeneratedResume resume = ResumeMappings.ToDomain(query.Resume!);

        ResumeThemeDefinition theme = format == ExportFormat.Docx
            ? await resumeThemeResolver.ResolveAsync(cancellationToken)
            : ResumeThemeCatalog.Default;

        byte[] content;
        try
        {
            content = exporter.Export(resume, theme);
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
