using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.PromptStyles.Update;

public sealed record UpdatePromptStyleCommand(
    Guid PromptStyleId,
    string? Name,
    string? Instructions) : ICommand<PromptStylesDto>;
