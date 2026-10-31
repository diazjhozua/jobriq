using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.Profiles.Review;

public sealed record ReviewProfileCommand(ProfileDto? Profile) : ICommand<ReviewProfileResponse>;
