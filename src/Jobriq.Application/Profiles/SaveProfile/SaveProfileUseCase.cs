using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Domain.Resumes;

namespace Jobriq.Application.Profiles.SaveProfile;

public sealed class SaveProfileUseCase(IJobriqRepository repository, IClientContext clientContext)
{
    public async Task<ResumeProfile> ExecuteAsync(
        ResumeProfile profile,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(profile);

        await repository.SaveProfileAsync(clientContext.ClientId, profile, cancellationToken);

        return profile;
    }
}
