using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Domain.Resumes;

namespace Jobriq.Application.Abstractions;

public interface IResumeExporter
{
    ExportFormat Format { get; }

    string ContentType { get; }

    byte[] Export(GeneratedResume resume);
}
