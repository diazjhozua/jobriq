namespace Jobriq.Application.Abstractions;

public sealed class MissingApiKeyException()
    : Exception("The OpenAI API key is not configured.");

public sealed class AiServiceException(string code, string message, int statusCode)
    : Exception(message)
{
    public string Code { get; } = code;

    public int StatusCode { get; } = statusCode;
}

public sealed class ExportFailedException(string message, Exception innerException)
    : Exception(message, innerException);
