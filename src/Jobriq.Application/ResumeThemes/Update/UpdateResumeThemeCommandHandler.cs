using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Errors;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.ResumeThemes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.ResumeThemes.Update;

internal sealed class UpdateResumeThemeCommandHandler(
    IJobriqRepository repository,
    IClientContext clientContext,
    TimeProvider timeProvider)
    : ICommandHandler<UpdateResumeThemeCommand, ResumeThemesDto>
{
    public async Task<Result<ResumeThemesDto>> Handle(
        UpdateResumeThemeCommand command,
        CancellationToken cancellationToken)
    {
        Guid clientId = clientContext.ClientId;

        if (ResumeThemeCatalog.IsBuiltIn(command.ResumeThemeId))
        {
            return Result.Failure<ResumeThemesDto>(ErrorCatalog.ResumeThemeReadOnly());
        }

        ResumeTheme? theme = await repository.GetResumeThemeAsync(
            clientId,
            command.ResumeThemeId,
            cancellationToken);

        if (theme is null)
        {
            return Result.Failure<ResumeThemesDto>(ErrorCatalog.ResumeThemeNotFound());
        }

        string name = command.Name!.Trim();

        if (ResumeThemeCatalog.IsReservedName(name))
        {
            return Result.Failure<ResumeThemesDto>(ErrorCatalog.ResumeThemeNameConflict(name));
        }

        bool nameTaken = await repository.ResumeThemeNameExistsAsync(
            clientId,
            name,
            theme.Id,
            cancellationToken);

        if (nameTaken)
        {
            return Result.Failure<ResumeThemesDto>(ErrorCatalog.ResumeThemeNameConflict(name));
        }

        theme.UpdateDetails(
            name,
            ResumeThemeMappings.ToDomain(command.Styles!),
            timeProvider.GetUtcNow());

        ResumeTheme? saved = await repository.SaveResumeThemeAsync(
            clientId,
            theme,
            cancellationToken);

        if (saved is null)
        {
            return Result.Failure<ResumeThemesDto>(ErrorCatalog.ResumeThemeNotFound());
        }

        ResumeThemeSettings settings = await repository.GetResumeThemesAsync(
            clientId,
            cancellationToken);

        return ResumeThemeMappings.ToDto(settings);
    }
}
