using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Profiles.Review;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.Profiles;

internal sealed class Review : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("profile/review", async (
            ReviewProfileRequest request,
            ICommandHandler<ReviewProfileCommand, ReviewProfileResponse> handler,
            CancellationToken cancellationToken) =>
        {
            Result<ReviewProfileResponse> result = await handler.Handle(
                new ReviewProfileCommand(request.Profile),
                cancellationToken);

            return result.Match(
                review => Results.Ok(review),
                CustomResults.Problem);
        })
        .WithTags(Tags.Profiles);
    }
}
