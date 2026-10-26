using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Persistence;
using Microsoft.AspNetCore.Diagnostics;

namespace Jobriq.Web.Infrastructure;

internal sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        (int status, string title, string detail, string code) = exception switch
        {
            MissingApiKeyException => (
                503,
                "OpenAI API key missing",
                "Set OpenAI:ApiKey with 'dotnet user-secrets set \"OpenAI:ApiKey\" \"<key>\" --project src/Jobriq.Web' or the OpenAI__ApiKey environment variable.",
                "missing_api_key"),
            AiServiceException aiException => (
                aiException.StatusCode,
                "Resume generation failed",
                aiException.Message,
                aiException.Code),
            ExportFailedException => (
                500,
                "Export failed",
                "The resume could not be exported.",
                "export_failed"),
            JobriqResourceNotFoundException notFoundException => (
                404,
                "Resource not found",
                $"The {notFoundException.Resource} was not found.",
                $"{notFoundException.Resource}_not_found"),
            JobriqPersistenceUnavailableException => (
                503,
                "Database unavailable",
                "The jobriq database is unavailable. Try again later.",
                "database_unavailable"),
            _ => (
                500,
                "Unexpected error",
                "An unexpected error occurred.",
                "server_error")
        };

        Log(httpContext, exception, status, code);

        IResult result = Results.Problem(
            title: title,
            detail: detail,
            statusCode: status,
            extensions: new Dictionary<string, object?> { ["code"] = code });

        await result.ExecuteAsync(httpContext);

        return true;
    }

    private void Log(HttpContext httpContext, Exception exception, int status, string code)
    {
        if (status >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(
                exception,
                "Request {Method} {Path} failed with {Code}.",
                httpContext.Request.Method,
                httpContext.Request.Path,
                code);
        }
        else
        {
            logger.LogWarning(
                exception,
                "Request {Method} {Path} failed with {Code}.",
                httpContext.Request.Method,
                httpContext.Request.Path,
                code);
        }
    }
}
