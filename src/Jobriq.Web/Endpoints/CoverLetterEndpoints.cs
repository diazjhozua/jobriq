using Jobriq.Application.CoverLetters.ExportCoverLetter;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Domain.Applications;

namespace Jobriq.Web.Endpoints;

internal static class CoverLetterEndpoints
{
    public static IEndpointRouteBuilder MapCoverLetterEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/cover-letter/export", Export);

        return endpoints;
    }

    private static IResult Export(ExportCoverLetterRequest request, ExportCoverLetterUseCase useCase)
    {
        if (request.Letter is null)
        {
            return EndpointProblems.InvalidRequest("A cover letter is required.");
        }

        if (request.Letter.Personal is null
            || string.IsNullOrWhiteSpace(request.Letter.Personal.Name)
            || request.Letter.Paragraphs is null)
        {
            return EndpointProblems.InvalidRequest("The cover letter is missing required content.");
        }

        ExportedFile file = useCase.Execute(request.Letter);

        return Results.File(file.Content, file.ContentType, file.FileName);
    }

    internal sealed class ExportCoverLetterRequest
    {
        public CoverLetter? Letter { get; set; }
    }
}
