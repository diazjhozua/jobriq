using Jobriq.Application.Abstractions;
using Microsoft.AspNetCore.Diagnostics;

namespace Jobriq.Web.Infrastructure;

internal sealed class GlobalExceptionHandler : IExceptionHandler
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
                "Set OpenAI:ApiKey with 'dotnet user-secrets set \"OpenAI:ApiKey\" \"<key>\" --project web/src/Jobriq.Web' or the OpenAI__ApiKey environment variable.",
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
            _ => (
                500,
                "Unexpected error",
                "An unexpected error occurred.",
                "server_error")
        };

        IResult result = Results.Problem(
            title: title,
            detail: detail,
            statusCode: status,
            extensions: new Dictionary<string, object?> { ["code"] = code });

        await result.ExecuteAsync(httpContext);

        return true;
    }
}
