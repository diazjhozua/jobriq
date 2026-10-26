using Jobriq.Application.Profiles.SaveProfile;
using Jobriq.Domain.Resumes;

namespace Jobriq.Web.Endpoints;

internal static class ProfileEndpoints
{
    public static IEndpointRouteBuilder MapProfileEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut("/api/profile", SaveProfileAsync);

        return endpoints;
    }

    private static async Task<IResult> SaveProfileAsync(
        SaveProfileRequest request,
        SaveProfileUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (request.Profile is null)
        {
            return EndpointProblems.InvalidRequest("A profile is required.");
        }

        ResumeProfile profile = await useCase.ExecuteAsync(request.Profile, cancellationToken);

        return Results.Ok(new SaveProfileResponse(profile));
    }

    internal sealed class SaveProfileRequest
    {
        public ResumeProfile? Profile { get; set; }
    }

    internal sealed record SaveProfileResponse(ResumeProfile Profile);
}
