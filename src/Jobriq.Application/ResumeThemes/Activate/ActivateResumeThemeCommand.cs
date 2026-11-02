using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.ResumeThemes.Activate;

public sealed record ActivateResumeThemeCommand(Guid ResumeThemeId) : ICommand<ResumeThemesDto>;
