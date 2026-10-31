using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.Applications.Create;

public sealed record CreateApplicationCommand(
    string? Company,
    string? Role,
    string? JobDescription,
    ApplicationStatusDto? Status,
    string? AppliedDate) : ICommand<ApplicationDto>;
