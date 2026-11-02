using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.ResumeThemes.Create;

public sealed record CreateResumeThemeCommand(string? Name, ResumeThemeStylesDto? Styles)
    : ICommand<ResumeThemesDto>;
