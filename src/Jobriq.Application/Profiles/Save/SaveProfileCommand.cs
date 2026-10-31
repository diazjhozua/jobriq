using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.Profiles.Save;

public sealed record SaveProfileCommand(ProfileDto? Profile) : ICommand<ProfileDto>;
