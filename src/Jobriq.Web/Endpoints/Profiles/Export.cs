using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Profiles.Export;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.Profiles;

internal sealed class Export : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("profile/export", async (
            ExportProfileRequest request,
            IQueryHandler<ExportProfileQuery, ExportedFile> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new ExportProfileQuery(request.Profile);

            Result<ExportedFile> result = await handler.Handle(query, cancellationToken);

            return result.Match(
                file => Results.File(file.Content, file.ContentType, file.FileName),
                CustomResults.Problem);
        })
        .WithTags(Tags.Profiles);
    }
}
