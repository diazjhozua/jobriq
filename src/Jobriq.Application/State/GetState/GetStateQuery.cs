using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Contracts;

namespace Jobriq.Application.State.GetState;

public sealed record GetStateQuery : IQuery<StateDto>;
