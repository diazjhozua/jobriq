using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.ResumeThemes.Delete;

public sealed record DeleteResumeThemeCommand(Guid ResumeThemeId) : ICommand<ResumeThemesDto>;
