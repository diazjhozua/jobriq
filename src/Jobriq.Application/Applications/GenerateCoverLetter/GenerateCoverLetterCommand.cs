using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.Applications.GenerateCoverLetter;

public sealed record GenerateCoverLetterCommand(Guid ApplicationId) : ICommand<ApplicationDto>;
