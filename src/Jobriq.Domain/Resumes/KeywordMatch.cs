namespace Jobriq.Domain.Resumes;

public sealed class KeywordMatch
{
    public List<string> Matched { get; set; } = [];

    public List<string> Missing { get; set; } = [];
}
