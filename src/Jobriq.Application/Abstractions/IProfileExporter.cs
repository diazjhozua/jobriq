using Jobriq.Domain.Resumes;

namespace Jobriq.Application.Abstractions;

public interface IProfileExporter
{
    string ContentType { get; }

    string FileExtension { get; }

    byte[] Export(ResumeProfile profile);
}
