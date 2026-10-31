using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Errors;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Applications.SaveGeneratedResume;

internal sealed class SaveGeneratedResumeCommandHandler(
    IJobriqRepository repository,
    IClientContext clientContext)
    : ICommandHandler<SaveGeneratedResumeCommand, ApplicationDto>
{
    public async Task<Result<ApplicationDto>> Handle(
        SaveGeneratedResumeCommand command,
        CancellationToken cancellationToken)
    {
        GeneratedResume resume = ResumeMappings.ToDomain(command.Resume!);

        JobApplication? application = await repository.SaveGeneratedResumeAsync(
            clientContext.ClientId,
            command.ApplicationId,
            resume,
            cancellationToken);

        return application is null
            ? Result.Failure<ApplicationDto>(ErrorCatalog.ApplicationNotFound())
            : ApplicationMappings.ToDto(application);
    }
}
