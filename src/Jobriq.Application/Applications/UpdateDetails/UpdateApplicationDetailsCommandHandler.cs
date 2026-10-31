using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Dates;
using Jobriq.Application.Common.Errors;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.Applications;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Applications.UpdateDetails;

internal sealed class UpdateApplicationDetailsCommandHandler(
    IJobriqRepository repository,
    IClientContext clientContext)
    : ICommandHandler<UpdateApplicationDetailsCommand, ApplicationDto>
{
    public async Task<Result<ApplicationDto>> Handle(
        UpdateApplicationDetailsCommand command,
        CancellationToken cancellationToken)
    {
        if (!AppliedDateParser.TryParse(command.AppliedDate, out DateOnly? appliedDate))
        {
            return Result.Failure<ApplicationDto>(
                ErrorCatalog.InvalidRequest("Date applied must be a valid date."));
        }

        JobApplication? application = await repository.UpdateApplicationDetailsAsync(
            clientContext.ClientId,
            command.ApplicationId,
            command.Company!,
            command.Role!,
            appliedDate,
            cancellationToken);

        return application is null
            ? Result.Failure<ApplicationDto>(ErrorCatalog.ApplicationNotFound())
            : ApplicationMappings.ToDto(application);
    }
}
