using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Profiles.Save;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.Profiles;

internal sealed class Save : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("profile", async (
            SaveProfileRequest request,
            ICommandHandler<SaveProfileCommand, ProfileDto> handler,
            CancellationToken cancellationToken) =>
        {
            Result<ProfileDto> result = await handler.Handle(
                new SaveProfileCommand(request.Profile),
                cancellationToken);

            return result.Match(
                profile => Results.Ok(new SaveProfileResponse { Profile = profile }),
                CustomResults.Problem);
        })
        .WithTags(Tags.Profiles);
    }
}
