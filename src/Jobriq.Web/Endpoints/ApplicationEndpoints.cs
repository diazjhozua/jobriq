using Jobriq.Application.Applications.CreateApplication;
using Jobriq.Application.Applications.DeleteApplication;
using Jobriq.Application.Applications.SaveGeneratedResume;
using Jobriq.Application.Applications.UpdateApplicationStatus;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;

namespace Jobriq.Web.Endpoints;

internal static class ApplicationEndpoints
{
    public static IEndpointRouteBuilder MapApplicationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        RouteGroupBuilder group = endpoints.MapGroup("/api/applications");

        group.MapPost("", CreateAsync);
        group.MapPatch("/{id:guid}/status", UpdateStatusAsync);
        group.MapDelete("/{id:guid}", DeleteAsync);
        group.MapPut("/{id:guid}/generated-resume", SaveGeneratedResumeAsync);

        return endpoints;
    }

    private static async Task<IResult> CreateAsync(
        CreateApplicationRequest request,
        CreateApplicationUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Company) || string.IsNullOrWhiteSpace(request.Role))
        {
            return EndpointProblems.InvalidRequest("Company and role are required.");
        }

        if (request.Status is { } status && !Enum.IsDefined(status))
        {
            return EndpointProblems.InvalidRequest("Unknown application status.");
        }

        JobApplication application = await useCase.ExecuteAsync(
            request.Company!,
            request.Role!,
            request.JobDescription ?? string.Empty,
            request.Status,
            cancellationToken);

        return Results.Created(
            $"/api/applications/{application.Id}",
            new ApplicationResponse(application));
    }

    private static async Task<IResult> UpdateStatusAsync(
        Guid id,
        UpdateStatusRequest request,
        UpdateApplicationStatusUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (request.Status is not { } status)
        {
            return EndpointProblems.InvalidRequest("A status is required.");
        }

        if (!Enum.IsDefined(status))
        {
            return EndpointProblems.InvalidRequest("Unknown application status.");
        }

        JobApplication application = await useCase.ExecuteAsync(id, status, cancellationToken);

        return Results.Ok(new ApplicationResponse(application));
    }

    private static async Task<IResult> DeleteAsync(
        Guid id,
        DeleteApplicationUseCase useCase,
        CancellationToken cancellationToken)
    {
        await useCase.ExecuteAsync(id, cancellationToken);

        return Results.NoContent();
    }

    private static async Task<IResult> SaveGeneratedResumeAsync(
        Guid id,
        SaveGeneratedResumeRequest request,
        SaveGeneratedResumeUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (request.Resume is null)
        {
            return EndpointProblems.InvalidRequest("A generated resume is required.");
        }

        JobApplication application = await useCase.ExecuteAsync(id, request.Resume, cancellationToken);

        return Results.Ok(new ApplicationResponse(application));
    }

    internal sealed class CreateApplicationRequest
    {
        public string? Company { get; set; }

        public string? Role { get; set; }

        public string? JobDescription { get; set; }

        public ApplicationStatus? Status { get; set; }
    }

    internal sealed class UpdateStatusRequest
    {
        public ApplicationStatus? Status { get; set; }
    }

    internal sealed class SaveGeneratedResumeRequest
    {
        public GeneratedResume? Resume { get; set; }
    }

    internal sealed record ApplicationResponse(JobApplication Application);
}
