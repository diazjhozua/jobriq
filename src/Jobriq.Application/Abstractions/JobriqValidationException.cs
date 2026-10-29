namespace Jobriq.Application.Abstractions;

public sealed class JobriqValidationException(string message) : Exception(message);
