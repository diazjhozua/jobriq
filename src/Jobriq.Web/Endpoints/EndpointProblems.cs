namespace Jobriq.Web.Endpoints;

internal static class EndpointProblems
{
    public static IResult InvalidRequest(string detail) =>
        Results.Problem(
            title: "Invalid request",
            detail: detail,
            statusCode: StatusCodes.Status400BadRequest,
            extensions: new Dictionary<string, object?> { ["code"] = "invalid_request" });
}
