using System.Text;
using Jobriq.Application.Abstractions;
using Jobriq.Domain.Resumes;

namespace Jobriq.Infrastructure.Export;

public sealed class TemplateProfileExporter : IProfileExporter
{
    public string ContentType => "text/plain; charset=utf-8";

    public string FileExtension => ".txt";

    public byte[] Export(ResumeProfile profile) =>
        new UTF8Encoding(encoderShouldEmitUTF8Identifier: false)
            .GetBytes(ProfileTemplateWriter.Write(profile));
}
