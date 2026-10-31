using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.Resumes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Profiles.Save;

internal sealed class SaveProfileCommandHandler(
    IJobriqRepository repository,
    IClientContext clientContext)
    : ICommandHandler<SaveProfileCommand, ProfileDto>
{
    public async Task<Result<ProfileDto>> Handle(
        SaveProfileCommand command,
        CancellationToken cancellationToken)
    {
        ResumeProfile profile = ProfileMappings.ToDomain(command.Profile!);

        await repository.SaveProfileAsync(clientContext.ClientId, profile, cancellationToken);

        return ProfileMappings.ToDto(profile);
    }
}
