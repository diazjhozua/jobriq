using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Dates;
using Jobriq.Application.Common.Errors;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.Applications;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Applications.Create;

internal sealed class CreateApplicationCommandHandler(
    IJobriqRepository repository,
    IClientContext clientContext)
    : ICommandHandler<CreateApplicationCommand, ApplicationDto>
{
    public async Task<Result<ApplicationDto>> Handle(
        CreateApplicationCommand command,
        CancellationToken cancellationToken)
    {
        if (!AppliedDateParser.TryParse(command.AppliedDate, out DateOnly? appliedDate))
        {
            return Result.Failure<ApplicationDto>(
                ErrorCatalog.InvalidRequest("Date applied must be a valid date."));
        }

        JobApplication application = new(
            command.Company!,
            command.Role!,
            command.JobDescription ?? string.Empty,
            appliedDate);

        if (command.Status is { } status)
        {
            application.ChangeStatus(EnumMappings.Map<ApplicationStatusDto, ApplicationStatus>(status));
        }

        JobApplication saved = await repository.AddApplicationAsync(
            clientContext.ClientId,
            application,
            cancellationToken);

        return ApplicationMappings.ToDto(saved);
    }
}
