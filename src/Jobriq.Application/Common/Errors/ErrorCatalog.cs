using Jobriq.SharedKernel;

namespace Jobriq.Application.Common.Errors;

public static class ErrorCatalog
{
    public static Error InvalidRequest(string description) =>
        Error.Validation("invalid_request", description);

    public static Error ApplicationNotFound() =>
        Error.NotFound("application_not_found", "The application was not found.");

    public static Error PromptStyleNotFound() =>
        Error.NotFound("prompt_style_not_found", "The prompt style was not found.");

    public static Error PromptStyleNameConflict(string name) =>
        Error.Conflict(
            "prompt_style_name_conflict",
            $"A prompt style named \"{name.Trim()}\" already exists.");

    public static Error MissingApiKey() =>
        Error.Unavailable(
            "missing_api_key",
            "Set OpenAI:ApiKey with 'dotnet user-secrets set \"OpenAI:ApiKey\" \"<key>\" --project src/Jobriq.Web' or the OpenAI__ApiKey environment variable.");

    public static Error AiService(string code, string description, int statusCode) =>
        statusCode == 429
            ? Error.TooManyRequests(code, description)
            : Error.BadGateway(code, description);

    public static Error ExportFailed(string description) =>
        Error.Failure("export_failed", description, 500);

    public static Error DatabaseUnavailable() =>
        Error.Unavailable("database_unavailable", "The jobriq database is unavailable. Try again later.");

    public static Error ServerError() =>
        Error.Failure("server_error", "An unexpected error occurred.", 500);
}
