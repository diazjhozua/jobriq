using Jobriq.Domain.Reviews;
using Jobriq.Domain.Resumes;

namespace Jobriq.Application.Profiles.Review;

internal static class ProfileReviewNormalizer
{
    private const int MaxSuggestions = 20;

    public static ProfileReview Normalize(
        IReadOnlyList<ReviewSuggestion> suggestions,
        ResumeProfile profile)
    {
        Dictionary<Guid, WorkExperience> experienceById = [];
        foreach (WorkExperience experience in profile.Experience)
        {
            experienceById.TryAdd(experience.Id, experience);
        }

        Dictionary<Guid, Project> projectsById = [];
        foreach (Project project in profile.Projects)
        {
            projectsById.TryAdd(project.Id, project);
        }

        List<ReviewSuggestion> normalized = [];
        foreach (ReviewSuggestion suggestion in suggestions)
        {
            ReviewSuggestion? next = Normalize(suggestion, profile, experienceById, projectsById);
            if (next is null)
            {
                continue;
            }

            normalized.Add(next);
            if (normalized.Count == MaxSuggestions)
            {
                break;
            }
        }

        return new ProfileReview { Suggestions = normalized };
    }

    private static ReviewSuggestion? Normalize(
        ReviewSuggestion suggestion,
        ResumeProfile profile,
        IReadOnlyDictionary<Guid, WorkExperience> experienceById,
        IReadOnlyDictionary<Guid, Project> projectsById)
    {
        string title = suggestion.Title.Trim();
        if (title.Length == 0)
        {
            return null;
        }

        string? proposedText = TrimToNull(suggestion.ProposedText);
        string? originalText = null;
        Guid? itemId = null;
        int? bulletIndex = null;

        switch (suggestion.Section)
        {
            case ReviewSection.Summary:
                originalText = TrimToNull(profile.Summary);
                break;

            case ReviewSection.Experience:
                if (!TryResolveExperience(suggestion, experienceById, out WorkExperience experience, out int experienceBulletIndex))
                {
                    if (proposedText is not null)
                    {
                        return null;
                    }

                    break;
                }

                itemId = experience.Id;
                bulletIndex = experienceBulletIndex;
                originalText = TrimToNull(experience.Bullets[experienceBulletIndex]);
                proposedText = CollapseToSingleLine(proposedText);
                break;

            case ReviewSection.Projects:
                if (!TryResolveProject(suggestion, projectsById, out Project project, out int projectBulletIndex))
                {
                    if (proposedText is not null)
                    {
                        return null;
                    }

                    break;
                }

                itemId = project.Id;
                bulletIndex = projectBulletIndex;
                originalText = TrimToNull(project.Bullets[projectBulletIndex]);
                proposedText = CollapseToSingleLine(proposedText);
                break;

            default:
                proposedText = null;
                break;
        }

        return new ReviewSuggestion
        {
            Id = Guid.NewGuid(),
            Section = suggestion.Section,
            ItemId = itemId,
            BulletIndex = bulletIndex,
            Category = suggestion.Category,
            Title = title,
            Detail = suggestion.Detail.Trim(),
            OriginalText = originalText,
            ProposedText = proposedText
        };
    }

    private static bool TryResolveExperience(
        ReviewSuggestion suggestion,
        IReadOnlyDictionary<Guid, WorkExperience> experienceById,
        out WorkExperience experience,
        out int bulletIndex)
    {
        experience = null!;
        bulletIndex = 0;

        if (suggestion.ItemId is not Guid id ||
            suggestion.BulletIndex is not int index ||
            !experienceById.TryGetValue(id, out WorkExperience? found) ||
            index < 0 ||
            index >= found.Bullets.Count)
        {
            return false;
        }

        experience = found;
        bulletIndex = index;
        return true;
    }

    private static bool TryResolveProject(
        ReviewSuggestion suggestion,
        IReadOnlyDictionary<Guid, Project> projectsById,
        out Project project,
        out int bulletIndex)
    {
        project = null!;
        bulletIndex = 0;

        if (suggestion.ItemId is not Guid id ||
            suggestion.BulletIndex is not int index ||
            !projectsById.TryGetValue(id, out Project? found) ||
            index < 0 ||
            index >= found.Bullets.Count)
        {
            return false;
        }

        project = found;
        bulletIndex = index;
        return true;
    }

    private static string? TrimToNull(string? value)
    {
        string? trimmed = value?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }

    private static string? CollapseToSingleLine(string? value)
    {
        if (value is null)
        {
            return null;
        }

        string[] parts = value.Split(
            ['\r', '\n'],
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        string collapsed = string.Join(' ', parts);
        return collapsed.Length == 0 ? null : collapsed;
    }
}
