using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.Resumes.Generate;

public sealed record GenerateResumeCommand(
    ProfileDto? Profile,
    string? JobDescription) : ICommand<GeneratedResumeDto>;
