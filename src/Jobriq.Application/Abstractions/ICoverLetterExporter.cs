using Jobriq.Domain.Applications;
using Jobriq.Domain.ResumeThemes;

namespace Jobriq.Application.Abstractions;

public interface ICoverLetterExporter
{
    string ContentType { get; }

    string FileExtension { get; }

    byte[] Export(CoverLetter letter, ResumeThemeDefinition theme);
}
