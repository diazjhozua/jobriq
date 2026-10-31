using Jobriq.Application.Abstractions;
using Jobriq.Application.CoverLetters.Generate;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;
using Shouldly;

namespace Jobriq.Application.Tests.CoverLetters;

public sealed class CoverLetterNormalizerTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 29, 12, 0, 0, TimeSpan.Zero);

    private const string Sentence =
        "I build dependable software with close attention to the people who use it, and I keep decisions documented so the team can move without guesswork or avoidable rework. "
        + "That habit has kept releases steady and made onboarding faster for every engineer who joined.";

    [Fact]
    public void Normalize_BuildsLetterFromDraft()
    {
        CoverLetterDraft draft = CreateDraft(paragraphs: 5);
        draft.Closing = "Best regards,";

        CoverLetter letter = CoverLetterNormalizer.Normalize(
            draft,
            CreateProfile(),
            " Acme ",
            " Engineer ",
            Now);

        letter.Salutation.ShouldBe("Dear Acme Hiring Team,");
        letter.Signature.ShouldBe("Jane Doe");
        letter.Closing.ShouldBe("Best regards,");
        letter.Company.ShouldBe("Acme");
        letter.Role.ShouldBe("Engineer");
        letter.Paragraphs.Count.ShouldBe(5);
        letter.Personal.Name.ShouldBe("Jane Doe");
        letter.GeneratedAt.ShouldBe(Now);
    }

    [Fact]
    public void Normalize_FallsBackToSincerelyForUnknownClosing()
    {
        CoverLetterDraft draft = CreateDraft();
        draft.Closing = "Cheers";

        CoverLetter letter = CoverLetterNormalizer.Normalize(
            draft,
            CreateProfile(),
            "Acme",
            "Engineer",
            Now);

        letter.Closing.ShouldBe("Sincerely,");
    }

    [Fact]
    public void Normalize_UsesHiringManagerWhenCompanyIsBlank()
    {
        CoverLetter letter = CoverLetterNormalizer.Normalize(
            CreateDraft(),
            CreateProfile(),
            "   ",
            "Engineer",
            Now);

        letter.Salutation.ShouldBe("Dear Hiring Manager,");
    }

    [Fact]
    public void Normalize_RejectsProfileWithoutName()
    {
        ResumeProfile profile = CreateProfile();
        profile.Personal.Name = "   ";

        Should.Throw<JobriqValidationException>(
            () => CoverLetterNormalizer.Normalize(CreateDraft(), profile, "Acme", "Engineer", Now));
    }

    [Fact]
    public void Normalize_RejectsTooFewParagraphs()
    {
        AiServiceException exception = Should.Throw<AiServiceException>(
            () => CoverLetterNormalizer.Normalize(
                CreateDraft(paragraphs: 2),
                CreateProfile(),
                "Acme",
                "Engineer",
                Now));

        exception.Code.ShouldBe("openai_invalid_response");
        exception.StatusCode.ShouldBe(502);
    }

    [Fact]
    public void Normalize_RejectsTooManyParagraphs()
    {
        Should.Throw<AiServiceException>(
            () => CoverLetterNormalizer.Normalize(
                CreateDraft(paragraphs: 7),
                CreateProfile(),
                "Acme",
                "Engineer",
                Now));
    }

    [Fact]
    public void Normalize_RejectsTooShortLetter()
    {
        CoverLetterDraft draft = CreateDraft(paragraphs: 3);
        draft.Paragraphs = [.. Enumerable.Repeat("Short paragraph with too few words.", 3)];

        AiServiceException exception = Should.Throw<AiServiceException>(
            () => CoverLetterNormalizer.Normalize(draft, CreateProfile(), "Acme", "Engineer", Now));

        exception.Message.ShouldContain("wrong length");
    }

    [Fact]
    public void Normalize_RejectsTooLongLetter()
    {
        CoverLetterDraft draft = CreateDraft(paragraphs: 6);
        draft.Paragraphs = [.. Enumerable.Repeat($"{Sentence} {Sentence} {Sentence}", 6)];

        AiServiceException exception = Should.Throw<AiServiceException>(
            () => CoverLetterNormalizer.Normalize(draft, CreateProfile(), "Acme", "Engineer", Now));

        exception.Message.ShouldContain("wrong length");
    }

    [Theory]
    [InlineData("I am writing to apply for this role.")]
    [InlineData("To whom it may concern, this role fits.")]
    [InlineData("I am confident that I would excel here.")]
    [InlineData("I am passionate about reliable systems.")]
    public void Normalize_RejectsBannedPhrases(string sentence)
    {
        CoverLetterDraft draft = CreateDraft(paragraphs: 5);
        draft.Paragraphs![0] = $"{draft.Paragraphs[0]} {sentence}";

        AiServiceException exception = Should.Throw<AiServiceException>(
            () => CoverLetterNormalizer.Normalize(draft, CreateProfile(), "Acme", "Engineer", Now));

        exception.Message.ShouldContain("template");
    }

    [Fact]
    public void Normalize_AllowsWordsThatContainBannedPhrases()
    {
        CoverLetterDraft draft = CreateDraft(paragraphs: 5);
        draft.Paragraphs![0] = $"{draft.Paragraphs[0]} The team stayed compassionate about the people it served.";

        CoverLetter letter = CoverLetterNormalizer.Normalize(
            draft,
            CreateProfile(),
            "Acme",
            "Engineer",
            Now);

        letter.Paragraphs.Count.ShouldBe(5);
    }

    [Fact]
    public void Normalize_IgnoresBannedPhrasesInsideCompanyName()
    {
        CoverLetterDraft draft = CreateDraft(paragraphs: 5);
        draft.Paragraphs![0] = $"{draft.Paragraphs[0]} Passionate About Pets builds dependable tools.";

        CoverLetter letter = CoverLetterNormalizer.Normalize(
            draft,
            CreateProfile(),
            "Passionate About Pets",
            "Engineer",
            Now);

        letter.Salutation.ShouldBe("Dear Passionate About Pets Hiring Team,");
    }

    [Fact]
    public void Normalize_SkipsNullParagraphs()
    {
        CoverLetterDraft draft = CreateDraft(paragraphs: 5);
        draft.Paragraphs!.Add(null!);

        CoverLetter letter = CoverLetterNormalizer.Normalize(
            draft,
            CreateProfile(),
            "Acme",
            "Engineer",
            Now);

        letter.Paragraphs.Count.ShouldBe(5);
    }

    [Fact]
    public void Normalize_CleansMarkdownAndWhitespace()
    {
        CoverLetterDraft draft = CreateDraft(paragraphs: 5);
        draft.Paragraphs![0] = "- **Built** a system\nthat   people trusted.";

        CoverLetter letter = CoverLetterNormalizer.Normalize(
            draft,
            CreateProfile(),
            "Acme",
            "Engineer",
            Now);

        letter.Paragraphs[0].ShouldBe("Built a system that people trusted.");
    }

    private static CoverLetterDraft CreateDraft(int paragraphs = 5) => new()
    {
        Closing = "Sincerely,",
        Paragraphs = [.. Enumerable.Range(0, paragraphs).Select(index => $"{Sentence} Point {index}.")]
    };

    private static ResumeProfile CreateProfile() => new()
    {
        Personal = new PersonalInfo
        {
            Name = "Jane Doe",
            Email = "jane@example.com",
            LinkedIn = "https://linkedin.com/in/jane"
        }
    };
}
