using Jobriq.SharedKernel;

namespace Jobriq.Web.Infrastructure;

internal static class CustomResults
{
    public static IResult Problem(Result result)
    {
        Error error = result.Error is ValidationError { Errors.Length: > 0 } validation
            ? validation.Errors[0]
            : result.Error;

        return Problem(error);
    }

    public static IResult Problem(Error error) =>
        Results.Problem(
            title: TitleFor(error),
            detail: error.Description,
            statusCode: error.StatusCode ?? StatusFor(error.Type),
            extensions: new Dictionary<string, object?> { ["code"] = error.Code });

    private static int StatusFor(ErrorType type) => type switch
    {
        ErrorType.Validation or ErrorType.Problem => StatusCodes.Status400BadRequest,
        ErrorType.NotFound => StatusCodes.Status404NotFound,
        ErrorType.Conflict => StatusCodes.Status409Conflict,
        ErrorType.Unavailable => StatusCodes.Status503ServiceUnavailable,
        ErrorType.TooManyRequests => StatusCodes.Status429TooManyRequests,
        ErrorType.BadGateway => StatusCodes.Status502BadGateway,
        _ => StatusCodes.Status500InternalServerError
    };

    private static string TitleFor(Error error) => error.Code switch
    {
        "missing_api_key" => "OpenAI API key missing",
        "database_unavailable" => "Database unavailable",
        "export_failed" => "Export failed",
        _ => error.Type switch
        {
            ErrorType.Validation => "Invalid request",
            ErrorType.NotFound => "Resource not found",
            ErrorType.Unavailable => "Service unavailable",
            ErrorType.TooManyRequests or ErrorType.BadGateway => "AI request failed",
            _ => "Unexpected error"
        }
    };
}
