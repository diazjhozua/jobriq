using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.ResumeThemes.Update;

public sealed record UpdateResumeThemeCommand(
    Guid ResumeThemeId,
    string? Name,
    ResumeThemeStylesDto? Styles) : ICommand<ResumeThemesDto>;
