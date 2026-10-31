using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Contracts;

namespace Jobriq.Application.Resumes.Export;

public sealed record ExportResumeQuery(
    GeneratedResumeDto? Resume,
    ExportFormatDto Format) : IQuery<ExportedFile>;
