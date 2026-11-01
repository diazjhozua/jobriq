using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.PromptStyles.Create;

public sealed record CreatePromptStyleCommand(string? Name, string? Instructions)
    : ICommand<PromptStylesDto>;
