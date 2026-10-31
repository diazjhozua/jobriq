namespace Jobriq.SharedKernel;

public record Error
{
    public static readonly Error None = new(string.Empty, string.Empty, ErrorType.Failure);

    public Error(string code, string description, ErrorType type, int? statusCode = null)
    {
        Code = code;
        Description = description;
        Type = type;
        StatusCode = statusCode;
    }

    public string Code { get; }

    public string Description { get; }

    public ErrorType Type { get; }

    public int? StatusCode { get; }

    public static Error Failure(string code, string description, int? statusCode = null) =>
        new(code, description, ErrorType.Failure, statusCode);

    public static Error Validation(string code, string description) =>
        new(code, description, ErrorType.Validation);

    public static Error Problem(string code, string description) =>
        new(code, description, ErrorType.Problem);

    public static Error NotFound(string code, string description) =>
        new(code, description, ErrorType.NotFound);

    public static Error Conflict(string code, string description) =>
        new(code, description, ErrorType.Conflict);

    public static Error Unavailable(string code, string description, int statusCode = 503) =>
        new(code, description, ErrorType.Unavailable, statusCode);

    public static Error TooManyRequests(string code, string description) =>
        new(code, description, ErrorType.TooManyRequests, 429);

    public static Error BadGateway(string code, string description) =>
        new(code, description, ErrorType.BadGateway, 502);
}
