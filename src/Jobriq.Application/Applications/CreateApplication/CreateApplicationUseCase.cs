using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Domain.Applications;

namespace Jobriq.Application.Applications.CreateApplication;

public sealed class CreateApplicationUseCase(IJobriqRepository repository, IClientContext clientContext)
{
    public Task<JobApplication> ExecuteAsync(
        string company,
        string role,
        string jobDescription,
        ApplicationStatus? status,
        CancellationToken cancellationToken)
    {
        JobApplication application = new(company, role, jobDescription);

        if (status is { } requestedStatus)
        {
            if (!Enum.IsDefined(requestedStatus))
            {
                throw new ArgumentOutOfRangeException(
                    nameof(status),
                    requestedStatus,
                    "Unknown application status.");
            }

            application.ChangeStatus(requestedStatus);
        }

        return repository.AddApplicationAsync(clientContext.ClientId, application, cancellationToken);
    }
}
