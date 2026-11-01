using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.PromptStyles.Delete;

public sealed record DeletePromptStyleCommand(Guid PromptStyleId) : ICommand<PromptStylesDto>;
