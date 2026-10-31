using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Errors;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.Applications;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Applications.UpdateStatus;

internal sealed class UpdateApplicationStatusCommandHandler(
    IJobriqRepository repository,
    IClientContext clientContext)
    : ICommandHandler<UpdateApplicationStatusCommand, ApplicationDto>
{
    public async Task<Result<ApplicationDto>> Handle(
        UpdateApplicationStatusCommand command,
        CancellationToken cancellationToken)
    {
        ApplicationStatus status =
            EnumMappings.Map<ApplicationStatusDto, ApplicationStatus>(command.Status!.Value);

        JobApplication? application = await repository.UpdateStatusAsync(
            clientContext.ClientId,
            command.ApplicationId,
            status,
            cancellationToken);

        return application is null
            ? Result.Failure<ApplicationDto>(ErrorCatalog.ApplicationNotFound())
            : ApplicationMappings.ToDto(application);
    }
}
