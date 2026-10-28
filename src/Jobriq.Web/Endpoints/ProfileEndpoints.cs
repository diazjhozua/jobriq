using Jobriq.Application.Profiles.GenerateStandaloneResume;
using Jobriq.Application.Profiles.ReviewProfile;
using Jobriq.Application.Profiles.SaveProfile;
using Jobriq.Domain.Reviews;
using Jobriq.Domain.Resumes;

namespace Jobriq.Web.Endpoints;

internal static class ProfileEndpoints
{
    public static IEndpointRouteBuilder MapProfileEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut("/api/profile", SaveProfileAsync);
        endpoints.MapPost("/api/profile/review", ReviewProfileAsync);
        endpoints.MapPost("/api/profile/resume", GenerateStandaloneResumeAsync);

        return endpoints;
    }

    private static async Task<IResult> GenerateStandaloneResumeAsync(
        GenerateStandaloneResumeRequest request,
        GenerateStandaloneResumeUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (request.Profile is null)
        {
            return EndpointProblems.InvalidRequest("A profile is required.");
        }

        GeneratedResume resume = await useCase.ExecuteAsync(
            request.Profile,
            request.JobDescription,
            cancellationToken);

        return Results.Ok(resume);
    }

    private static async Task<IResult> ReviewProfileAsync(
        ReviewProfileRequest request,
        ReviewProfileUseCase useCase,
        CancellationToken cancellationToken)
    {
        if (request.Profile is null || !IsReviewable(request.Profile))
        {
            return EndpointProblems.InvalidRequest("A complete profile is required.");
        }

        ProfileReview review = await useCase.ExecuteAsync(request.Profile, cancellationToken);

        return Results.Ok(new ReviewProfileResponse(review.Suggestions));
    }

    private static bool IsReviewable(ResumeProfile profile) =>
        profile.Personal is not null &&
        profile.Experience is not null &&
        profile.Experience.All(experience => experience is not null && experience.Bullets is not null) &&
        profile.Education is not null &&
        profile.Education.All(education => education is not null) &&
        profile.Skills is not null &&
        profile.Projects is not null &&
        profile.Projects.All(project => project is not null && project.Bullets is not null);

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

    internal sealed class ReviewProfileRequest
    {
        public ResumeProfile? Profile { get; set; }
    }

    internal sealed record ReviewProfileResponse(IReadOnlyList<ReviewSuggestion> Suggestions);

    internal sealed class GenerateStandaloneResumeRequest
    {
        public ResumeProfile? Profile { get; set; }

        public string? JobDescription { get; set; }
    }
}
