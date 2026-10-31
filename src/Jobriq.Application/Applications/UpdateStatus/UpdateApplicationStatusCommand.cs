using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.Applications.UpdateStatus;

public sealed record UpdateApplicationStatusCommand(
    Guid ApplicationId,
    ApplicationStatusDto? Status) : ICommand<ApplicationDto>;
