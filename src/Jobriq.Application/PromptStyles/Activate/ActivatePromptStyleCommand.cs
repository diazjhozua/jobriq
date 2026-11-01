using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.PromptStyles.Activate;

public sealed record ActivatePromptStyleCommand(Guid PromptStyleId) : ICommand<PromptStylesDto>;
