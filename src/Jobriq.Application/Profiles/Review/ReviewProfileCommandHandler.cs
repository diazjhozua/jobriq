using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.PiiMasking;
using Jobriq.Application.Common.Mapping;
using Jobriq.Application.PiiMasking;
using Jobriq.Contracts;
using Jobriq.Domain.PiiMasking;
using Jobriq.Domain.Reviews;
using Jobriq.Domain.Resumes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Profiles.Review;

internal sealed class ReviewProfileCommandHandler(
    IResumeAiService aiService,
    IPiiMaskingSettingsResolver piiMaskingSettingsResolver)
    : ICommandHandler<ReviewProfileCommand, ReviewProfileResponse>
{
    public async Task<Result<ReviewProfileResponse>> Handle(
        ReviewProfileCommand command,
        CancellationToken cancellationToken)
    {
        ResumeProfile profile = ProfileMappings.ToDomain(command.Profile!);

        aiService.EnsureAvailable();

        PiiMaskingSettings masking = await piiMaskingSettingsResolver.ResolveAsync(
            cancellationToken);

        ResumeProfile aiProfile = ProfileRedactor.Redact(profile, masking);

        IReadOnlyList<ReviewSuggestion> suggestions =
            await aiService.ReviewProfileAsync(
                aiProfile,
                masking.Enabled,
                cancellationToken);

        ProfileReview review = ProfileReviewNormalizer.Normalize(suggestions, profile);

        return ReviewMappings.ToResponse(review);
    }
}
