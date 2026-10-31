using Jobriq.Application.Abstractions.Messaging;

namespace Jobriq.Application.Applications.Delete;

public sealed record DeleteApplicationCommand(Guid ApplicationId) : ICommand;
