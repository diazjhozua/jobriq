using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Common.Mapping;
using Jobriq.Contracts;
using Jobriq.Domain.Reviews;
using Jobriq.Domain.Resumes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Profiles.Review;

internal sealed class ReviewProfileCommandHandler(IResumeAiService aiService)
    : ICommandHandler<ReviewProfileCommand, ReviewProfileResponse>
{
    public async Task<Result<ReviewProfileResponse>> Handle(
        ReviewProfileCommand command,
        CancellationToken cancellationToken)
    {
        ResumeProfile profile = ProfileMappings.ToDomain(command.Profile!);

        aiService.EnsureAvailable();

        IReadOnlyList<ReviewSuggestion> suggestions =
            await aiService.ReviewProfileAsync(profile, cancellationToken);

        ProfileReview review = ProfileReviewNormalizer.Normalize(suggestions, profile);

        return ReviewMappings.ToResponse(review);
    }
}
