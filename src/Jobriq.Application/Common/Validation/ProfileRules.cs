using Jobriq.Contracts;

namespace Jobriq.Application.Common.Validation;

public static class ProfileRules
{
    public static bool HasValidCollections(ProfileDto? profile) =>
        profile is not null &&
        profile.Personal is not null &&
        profile.Experience is not null &&
        profile.Experience.All(experience => experience is not null && experience.Bullets is not null) &&
        profile.Education is not null &&
        profile.Education.All(education => education is not null) &&
        profile.Certifications is not null &&
        profile.Certifications.All(certification => certification is not null) &&
        profile.Awards is not null &&
        profile.Awards.All(award => award is not null) &&
        profile.Skills is not null &&
        profile.Projects is not null &&
        profile.Projects.All(project => project is not null && project.Bullets is not null);
}
