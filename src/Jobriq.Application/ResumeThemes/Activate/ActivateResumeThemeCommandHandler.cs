using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Errors;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.ResumeThemes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.ResumeThemes.Activate;

internal sealed class ActivateResumeThemeCommandHandler(
    IJobriqRepository repository,
    IClientContext clientContext)
    : ICommandHandler<ActivateResumeThemeCommand, ResumeThemesDto>
{
    public async Task<Result<ResumeThemesDto>> Handle(
        ActivateResumeThemeCommand command,
        CancellationToken cancellationToken)
    {
        Guid clientId = clientContext.ClientId;

        bool activated = await repository.ActivateResumeThemeAsync(
            clientId,
            command.ResumeThemeId,
            cancellationToken);

        if (!activated)
        {
            return Result.Failure<ResumeThemesDto>(ErrorCatalog.ResumeThemeNotFound());
        }

        ResumeThemeSettings settings = await repository.GetResumeThemesAsync(
            clientId,
            cancellationToken);

        return ResumeThemeMappings.ToDto(settings);
    }
}
