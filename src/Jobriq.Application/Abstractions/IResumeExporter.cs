using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Domain.ResumeThemes;
using Jobriq.Domain.Resumes;

namespace Jobriq.Application.Abstractions;

public interface IResumeExporter
{
    ExportFormat Format { get; }

    string ContentType { get; }

    byte[] Export(GeneratedResume resume, ResumeThemeDefinition theme);
}
