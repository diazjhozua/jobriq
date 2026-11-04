using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.PiiMasking.Update;

public sealed record UpdatePiiMaskingCommand(bool? Enabled) : ICommand<PiiMaskingDto>;
