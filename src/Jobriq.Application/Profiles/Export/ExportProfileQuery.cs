using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Contracts;

namespace Jobriq.Application.Profiles.Export;

public sealed record ExportProfileQuery(ProfileDto? Profile) : IQuery<ExportedFile>;
