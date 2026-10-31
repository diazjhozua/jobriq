using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Resumes.Export;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.Resumes;

internal sealed class Export : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("resume/export", async (
            ExportResumeRequest request,
            IQueryHandler<ExportResumeQuery, ExportedFile> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new ExportResumeQuery(request.Resume, request.Format);

            Result<ExportedFile> result = await handler.Handle(query, cancellationToken);

            return result.Match(
                file => Results.File(file.Content, file.ContentType, file.FileName),
                CustomResults.Problem);
        })
        .WithTags(Tags.Resumes);
    }
}
