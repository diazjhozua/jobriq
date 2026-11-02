using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Errors;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.ResumeThemes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.ResumeThemes.Create;

internal sealed class CreateResumeThemeCommandHandler(
    IJobriqRepository repository,
    IClientContext clientContext,
    TimeProvider timeProvider)
    : ICommandHandler<CreateResumeThemeCommand, ResumeThemesDto>
{
    public async Task<Result<ResumeThemesDto>> Handle(
        CreateResumeThemeCommand command,
        CancellationToken cancellationToken)
    {
        Guid clientId = clientContext.ClientId;
        string name = command.Name!.Trim();

        if (ResumeThemeCatalog.IsReservedName(name))
        {
            return Result.Failure<ResumeThemesDto>(ErrorCatalog.ResumeThemeNameConflict(name));
        }

        bool nameTaken = await repository.ResumeThemeNameExistsAsync(
            clientId,
            name,
            null,
            cancellationToken);

        if (nameTaken)
        {
            return Result.Failure<ResumeThemesDto>(ErrorCatalog.ResumeThemeNameConflict(name));
        }

        ResumeTheme theme = ResumeTheme.Create(
            name,
            ResumeThemeMappings.ToDomain(command.Styles!),
            timeProvider.GetUtcNow());

        await repository.AddResumeThemeAsync(clientId, theme, cancellationToken);

        ResumeThemeSettings settings = await repository.GetResumeThemesAsync(
            clientId,
            cancellationToken);

        return ResumeThemeMappings.ToDto(settings);
    }
}
