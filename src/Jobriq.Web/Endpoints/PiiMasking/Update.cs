using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.PiiMasking.Update;
using Jobriq.Contracts;
using Jobriq.SharedKernel;
using Jobriq.Web.Extensions;
using Jobriq.Web.Infrastructure;

namespace Jobriq.Web.Endpoints.PiiMasking;

internal sealed class Update : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("pii-masking", async (
            UpdatePiiMaskingRequest request,
            ICommandHandler<UpdatePiiMaskingCommand, PiiMaskingDto> handler,
            CancellationToken cancellationToken) =>
        {
            UpdatePiiMaskingCommand command = new(request.Enabled);

            Result<PiiMaskingDto> result = await handler.Handle(command, cancellationToken);

            return result.Match(dto => Results.Ok(dto), CustomResults.Problem);
        })
        .WithTags(Tags.PiiMasking);
    }
}
