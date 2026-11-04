using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Common.Mapping;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Domain.Resumes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Profiles.Export;

internal sealed class ExportProfileQueryHandler(
    IProfileExporter exporter,
    TimeProvider timeProvider)
    : IQueryHandler<ExportProfileQuery, ExportedFile>
{
    public Task<Result<ExportedFile>> Handle(
        ExportProfileQuery query,
        CancellationToken cancellationToken)
    {
        ResumeProfile profile = ProfileMappings.ToDomain(query.Profile!);

        byte[] content;
        try
        {
            content = exporter.Export(profile);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            throw new ExportFailedException("The profile could not be exported.", exception);
        }

        string baseName = ResumeFileName.Create(
            profile.Personal.Name,
            timeProvider.GetLocalNow(),
            "profile");

        return Task.FromResult(
            Result.Success(new ExportedFile(
                content,
                $"{baseName}{exporter.FileExtension}",
                exporter.ContentType)));
    }
}
