using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.Profiles.GenerateStandaloneResume;

public sealed record GenerateStandaloneResumeCommand(
    ProfileDto? Profile,
    string? JobDescription) : ICommand<GeneratedResumeDto>;
