using Jobriq.Domain.Applications;

namespace Jobriq.Application.Abstractions;

public interface ICoverLetterExporter
{
    string ContentType { get; }

    string FileExtension { get; }

    byte[] Export(CoverLetter letter);
}
