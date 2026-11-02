using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Errors;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.ResumeThemes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.ResumeThemes.Delete;

internal sealed class DeleteResumeThemeCommandHandler(
    IJobriqRepository repository,
    IClientContext clientContext)
    : ICommandHandler<DeleteResumeThemeCommand, ResumeThemesDto>
{
    public async Task<Result<ResumeThemesDto>> Handle(
        DeleteResumeThemeCommand command,
        CancellationToken cancellationToken)
    {
        Guid clientId = clientContext.ClientId;

        if (ResumeThemeCatalog.IsBuiltIn(command.ResumeThemeId))
        {
            return Result.Failure<ResumeThemesDto>(ErrorCatalog.ResumeThemeReadOnly());
        }

        bool deleted = await repository.DeleteResumeThemeAsync(
            clientId,
            command.ResumeThemeId,
            cancellationToken);

        if (!deleted)
        {
            return Result.Failure<ResumeThemesDto>(ErrorCatalog.ResumeThemeNotFound());
        }

        ResumeThemeSettings settings = await repository.GetResumeThemesAsync(
            clientId,
            cancellationToken);

        return ResumeThemeMappings.ToDto(settings);
    }
}
