namespace Jobriq.Domain.PromptStyles;

public static class PromptStyleCatalog
{
    public static readonly Guid BuiltInId = new("00000000-0000-0000-0000-000000000001");

    public const string BuiltInName = "Default voice";

    public const string BuiltInInstructions =
        """
        Write like an experienced candidate describing real work to a hiring manager.

        - Lead with what was built, changed, or delivered, then say why it mattered.
        - Keep every bullet to one sentence and describe the work without starting with "I".
        - Use the numbers the profile already contains; never invent metrics, employers, dates, or technologies.
        - Prefer concrete verbs such as built, led, migrated, and automated over helped, worked on, or responsible for.
        - Keep the tone professional and plain; no marketing superlatives.
        - Match the candidate's own vocabulary for tools and job titles.

        This is the built-in baseline. It cannot be edited or deleted, and it applies
        whenever no saved style is active.
        """;
}
