using Jobriq.Application.Common.Errors;
using Jobriq.SharedKernel;
using Microsoft.AspNetCore.Diagnostics;

namespace Jobriq.Web.Infrastructure;

internal sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        Error error = ExceptionErrorMapper.TryMap(exception, out Error mapped)
            ? mapped
            : ErrorCatalog.ServerError();

        Log(httpContext, exception, error);

        IResult result = CustomResults.Problem(error);

        await result.ExecuteAsync(httpContext);

        return true;
    }

    private void Log(HttpContext httpContext, Exception exception, Error error)
    {
        int status = error.StatusCode ?? 500;

        if (status >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(
                exception,
                "Request {Method} {Path} failed with {Code}.",
                httpContext.Request.Method,
                httpContext.Request.Path,
                error.Code);
        }
        else
        {
            logger.LogWarning(
                exception,
                "Request {Method} {Path} failed with {Code}.",
                httpContext.Request.Method,
                httpContext.Request.Path,
                error.Code);
        }
    }
}
