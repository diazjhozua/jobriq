using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.CoverLetters.Export;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.CoverLetters;

internal sealed class Export : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("cover-letter/export", async (
            ExportCoverLetterRequest request,
            IQueryHandler<ExportCoverLetterQuery, ExportedFile> handler,
            CancellationToken cancellationToken) =>
        {
            Result<ExportedFile> result = await handler.Handle(
                new ExportCoverLetterQuery(request.Letter),
                cancellationToken);

            return result.Match(
                file => Results.File(file.Content, file.ContentType, file.FileName),
                CustomResults.Problem);
        })
        .WithTags(Tags.CoverLetters);
    }
}
