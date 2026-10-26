namespace Jobriq.Application.Abstractions.Persistence;

public sealed class JobriqResourceNotFoundException(string resource, Guid id)
    : Exception($"The {resource} with id '{id}' was not found.")
{
    public string Resource { get; } = resource;

    public Guid Id { get; } = id;
}

public sealed class JobriqPersistenceUnavailableException(string message, Exception innerException)
    : Exception(message, innerException);
