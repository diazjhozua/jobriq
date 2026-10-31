using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.Applications.SaveGeneratedResume;

public sealed record SaveGeneratedResumeCommand(
    Guid ApplicationId,
    GeneratedResumeDto? Resume) : ICommand<ApplicationDto>;
