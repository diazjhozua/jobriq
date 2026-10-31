using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.Applications.UpdateDetails;

public sealed record UpdateApplicationDetailsCommand(
    Guid ApplicationId,
    string? Company,
    string? Role,
    string? AppliedDate) : ICommand<ApplicationDto>;
