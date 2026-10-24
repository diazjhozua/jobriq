using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Application.Resumes.GenerateResume;
using Jobriq.Domain.Resumes;

namespace Jobriq.Web.Endpoints;

internal static class ResumeEndpoints
{
    public static IEndpointRouteBuilder MapResumeEndpoints(this IEndpointRouteBuilder endpoints)
    {
        RouteGroupBuilder group = endpoints.MapGroup("/api/resume");

        group.MapPost("/generate", GenerateAsync);
        group.MapPost("/export", Export);

        return endpoints;
    }

    private static async Task<IResult> GenerateAsync(
        GenerateRequest request,
        GenerateResumeUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (request.Profile is null)
        {
            return Results.Problem(
                title: "Invalid request",
                detail: "A profile is required.",
                statusCode: StatusCodes.Status400BadRequest,
                extensions: new Dictionary<string, object?> { ["code"] = "invalid_request" });
        }

        GeneratedResume resume = await useCase.ExecuteAsync(
            request.Profile,
            request.JobDescription,
            cancellationToken);

        return Results.Ok(resume);
    }

    private static IResult Export(ExportRequest request, ExportResumeUseCase useCase)
    {
        if (request.Resume is null)
        {
            return Results.Problem(
                title: "Invalid request",
                detail: "A generated resume is required.",
                statusCode: StatusCodes.Status400BadRequest,
                extensions: new Dictionary<string, object?> { ["code"] = "invalid_request" });
        }

        ExportedFile file = useCase.Execute(request.Resume, request.Format);

        return Results.File(file.Content, file.ContentType, file.FileName);
    }

    internal sealed class GenerateRequest
    {
        public ResumeProfile? Profile { get; set; }

        public string? JobDescription { get; set; }
    }

    internal sealed class ExportRequest
    {
        public GeneratedResume? Resume { get; set; }

        public ExportFormat Format { get; set; }
    }
}
