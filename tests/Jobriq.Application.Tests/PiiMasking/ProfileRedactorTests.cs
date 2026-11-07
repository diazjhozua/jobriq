using Jobriq.Application.Common.Mapping;
using Jobriq.Application.PiiMasking;
using Jobriq.Domain.PiiMasking;
using Jobriq.Domain.Resumes;
using Shouldly;

namespace Jobriq.Application.Tests.PiiMasking;

public sealed class ProfileRedactorTests
{
    private static readonly PiiMaskingSettings Enabled = new(true);
    private static readonly PiiMaskingSettings Disabled = new(false);

    [Fact]
    public void RedactsEveryPersonalField()
    {
        ResumeProfile profile = CreateProfile();

        ResumeProfile redacted = ProfileRedactor.Redact(profile, Enabled);

        redacted.Personal.Name.ShouldBe(ProfileRedactor.Placeholder);
        redacted.Personal.Email.ShouldBe(ProfileRedactor.Placeholder);
        redacted.Personal.Phone.ShouldBe(ProfileRedactor.Placeholder);
        redacted.Personal.Location.ShouldBe(ProfileRedactor.Placeholder);
        redacted.Personal.LinkedIn.ShouldBe(ProfileRedactor.Placeholder);
        redacted.Personal.GitHub.ShouldBe(ProfileRedactor.Placeholder);
        redacted.Personal.Website.ShouldBe(ProfileRedactor.Placeholder);
    }

    [Fact]
    public void DoesNotMutateTheInput()
    {
        ResumeProfile profile = CreateProfile();
        profile.Summary = "Jane Doe built reliable systems.";

        ProfileRedactor.Redact(profile, Enabled);

        profile.Personal.Name.ShouldBe("Jane Doe");
        profile.Summary.ShouldBe("Jane Doe built reliable systems.");
    }

    [Fact]
    public void ScrubsContactValuesFromFreeText()
    {
        ResumeProfile profile = CreateProfile();
        profile.Summary = "Reach Jane Doe at jane@example.com or (555) 0100 from Remote.";
        profile.Experience[0].Bullets = ["jane@example.com reviewed the build"];
        profile.Education[0].School = "Jane Doe University";
        profile.Awards[0].Description = "Awarded to Jane Doe.";
        profile.Projects[0].Description = "Built by Jane Doe for jane@example.com.";
        profile.Projects[0].Bullets = ["Built by Jane Doe"];

        ResumeProfile redacted = ProfileRedactor.Redact(profile, Enabled);

        redacted.Summary.ShouldContain(ProfileRedactor.Placeholder);
        redacted.Summary.ShouldNotContain("Jane Doe");
        redacted.Summary.ShouldNotContain("jane@example.com");
        redacted.Summary.ShouldNotContain("(555) 0100");
        redacted.Summary.ShouldNotContain("Remote");

        redacted.Experience[0].Bullets[0].ShouldNotContain("jane@example.com");
        redacted.Education[0].School.ShouldNotContain("Jane Doe");
        redacted.Awards[0].Description.ShouldNotContain("Jane Doe");
        redacted.Projects[0].Description.ShouldNotContain("Jane Doe");
        redacted.Projects[0].Description.ShouldNotContain("jane@example.com");
        redacted.Projects[0].Bullets[0].ShouldNotContain("Jane Doe");
    }

    [Fact]
    public void ScrubsUrlsWithAndWithoutScheme()
    {
        ResumeProfile profile = CreateProfile();
        profile.Summary = "Portfolio: https://janedoe.dev and janedoe.dev";

        ResumeProfile redacted = ProfileRedactor.Redact(profile, Enabled);

        redacted.Summary.ShouldNotContain("janedoe.dev");
        redacted.Summary.ShouldContain(ProfileRedactor.Placeholder);
    }

    [Fact]
    public void ScrubsSkillsButLeavesSkillsGainedUntouched()
    {
        ResumeProfile profile = CreateProfile();
        profile.Skills = ["C#", "Jane Doe"];
        profile.Experience[0].SkillsGained = ["Jane Doe"];

        ResumeProfile redacted = ProfileRedactor.Redact(profile, Enabled);

        redacted.Skills.ShouldBe(["C#", ProfileRedactor.Placeholder]);
        redacted.Experience[0].SkillsGained.ShouldBe(["Jane Doe"]);
    }

    [Fact]
    public void ScrubsNameTokensEmailLocalPartAndLocationParts()
    {
        ResumeProfile profile = CreateProfile();
        profile.Personal.Location = "New York, NY";
        profile.Summary = "Jane led the migration from New York; jane replied to jane@example.com.";
        profile.Experience[0].Bullets = ["Jane shipped it"];

        ResumeProfile redacted = ProfileRedactor.Redact(profile, Enabled);

        redacted.Summary.ShouldNotContain("Jane");
        redacted.Summary.ShouldNotContain("New York");
        redacted.Summary.ShouldNotContain("jane@example.com");
        redacted.Experience[0].Bullets[0].ShouldNotContain("Jane");
    }

    [Fact]
    public void ScrubsUrlHandles()
    {
        ResumeProfile profile = CreateProfile();
        profile.Summary = "See github.com/janedoe and linkedin.com/in/janedoe.";

        ResumeProfile redacted = ProfileRedactor.Redact(profile, Enabled);

        redacted.Summary.ShouldNotContain("janedoe");
    }

    [Fact]
    public void ScrubsPhoneSuffixesWhenTheStoredNumberHasACountryCode()
    {
        ResumeProfile profile = CreateProfile();
        profile.Personal.Phone = "+1 (555) 0100";
        profile.Summary = "Call 555-0100 or (555) 0100.";

        ResumeProfile redacted = ProfileRedactor.Redact(profile, Enabled);

        redacted.Summary.ShouldNotContain("555-0100");
        redacted.Summary.ShouldNotContain("(555) 0100");
    }

    [Fact]
    public void SkipsAmbiguousSingleTokenNames()
    {
        ResumeProfile profile = CreateProfile();
        profile.Personal.Name = "Will";
        profile.Summary = "I will build the thing.";

        ResumeProfile redacted = ProfileRedactor.Redact(profile, Enabled);

        redacted.Personal.Name.ShouldBe(ProfileRedactor.Placeholder);
        redacted.Summary.ShouldBe("I will build the thing.");
    }

    [Fact]
    public void SkipsShortValuesInFreeTextButRedactsTheHeader()
    {
        ResumeProfile profile = CreateProfile();
        profile.Personal.Name = "Al";
        profile.Experience[0].Bullets = ["Al fixed the build"];

        ResumeProfile redacted = ProfileRedactor.Redact(profile, Enabled);

        redacted.Personal.Name.ShouldBe(ProfileRedactor.Placeholder);
        redacted.Experience[0].Bullets[0].ShouldBe("Al fixed the build");
    }

    [Fact]
    public void UsesWholeWordBoundaries()
    {
        ResumeProfile profile = CreateProfile();
        profile.Personal.Name = "Ann";
        profile.Experience[0].Bullets = ["Celebrated the anniversary"];

        ResumeProfile redacted = ProfileRedactor.Redact(profile, Enabled);

        redacted.Experience[0].Bullets[0].ShouldBe("Celebrated the anniversary");
    }

    [Fact]
    public void IsIdempotent()
    {
        ResumeProfile profile = CreateProfile();
        profile.Summary = "Contact Jane Doe at jane@example.com.";

        ResumeProfile once = ProfileRedactor.Redact(profile, Enabled);
        ResumeProfile twice = ProfileRedactor.Redact(once, Enabled);

        twice.Summary.ShouldBe(once.Summary);
        twice.Personal.Name.ShouldBe(once.Personal.Name);
    }

    [Fact]
    public void PreservesAnExistingPlaceholder()
    {
        ResumeProfile profile = CreateProfile();
        profile.Experience[0].Bullets = ["Contact [redacted] now"];

        ResumeProfile redacted = ProfileRedactor.Redact(profile, Enabled);

        redacted.Experience[0].Bullets[0].ShouldBe("Contact [redacted] now");
    }

    [Fact]
    public void DisabledReturnsAFaithfulClone()
    {
        ResumeProfile profile = CreateProfile();
        profile.Experience[0].EnhancedBullets =
        [
            new EnhancedBullet { Original = "Built it", Enhanced = "Enhanced: Built it" }
        ];

        ResumeProfile clone = ProfileRedactor.Redact(profile, Disabled);

        clone.ShouldNotBeSameAs(profile);
        clone.Personal.Name.ShouldBe("Jane Doe");
        clone.Summary.ShouldBe(profile.Summary);
        clone.Experience[0].EnhancedBullets!.Single().Enhanced.ShouldBe("Enhanced: Built it");
        clone.Experience[0].SkillsGained.ShouldBe(profile.Experience[0].SkillsGained);
    }

    [Fact]
    public void RemovePlaceholdersCollapsesWhitespace()
    {
        ProfileRedactor.RemovePlaceholders("Built [redacted]  the   thing")
            .ShouldBe("Built the thing");
    }

    [Fact]
    public void RemovePlaceholdersPreservingLinesKeepsParagraphs()
    {
        ProfileRedactor.RemovePlaceholdersPreservingLines(
                "Built [redacted]  the   thing\n\nShipped it to [redacted].")
            .ShouldBe("Built the thing\n\nShipped it to.");
    }

    [Fact]
    public void RemovePlaceholdersPreservingLinesTrimsBlankEdges()
    {
        ProfileRedactor.RemovePlaceholdersPreservingLines("\n\nBuilt it\n\n")
            .ShouldBe("Built it");
        ProfileRedactor.RemovePlaceholdersPreservingLines("   ").ShouldBeEmpty();
    }

    private static ResumeProfile CreateProfile() =>
        ProfileMappings.ToDomain(TestData.Profile());
}
