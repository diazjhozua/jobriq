using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Common.Errors;

public static class ExceptionErrorMapper
{
    public static bool TryMap(Exception exception, out Error error)
    {
        switch (exception)
        {
            case MissingApiKeyException:
                error = ErrorCatalog.MissingApiKey();
                return true;
            case AiServiceException aiException:
                error = ErrorCatalog.AiService(
                    aiException.Code,
                    aiException.Message,
                    aiException.StatusCode);
                return true;
            case ExportFailedException exportException:
                error = ErrorCatalog.ExportFailed(exportException.Message);
                return true;
            case JobriqValidationException validationException:
                error = ErrorCatalog.InvalidRequest(validationException.Message);
                return true;
            case JobriqResourceNotFoundException notFoundException:
                error = Error.NotFound(
                    $"{notFoundException.Resource}_not_found",
                    $"The {notFoundException.Resource} was not found.");
                return true;
            case JobriqPersistenceUnavailableException:
                error = ErrorCatalog.DatabaseUnavailable();
                return true;
            default:
                error = Error.None;
                return false;
        }
    }
}
