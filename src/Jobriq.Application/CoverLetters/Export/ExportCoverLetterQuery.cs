using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Contracts;

namespace Jobriq.Application.CoverLetters.Export;

public sealed record ExportCoverLetterQuery(CoverLetterDto? Letter) : IQuery<ExportedFile>;
