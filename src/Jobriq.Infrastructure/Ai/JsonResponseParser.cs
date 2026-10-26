using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Jobriq.Infrastructure.Ai;

internal static partial class JsonResponseParser
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static T? Parse<T>(string content)
    {
        string text = content.Trim();
        Match fenced = FencedBlock().Match(text);
        string raw = fenced.Success ? fenced.Groups[1].Value : text;

        if (!fenced.Success)
        {
            int start = text.IndexOf('{');
            int end = text.LastIndexOf('}');
            if (start >= 0 && end > start)
            {
                raw = text[start..(end + 1)];
            }
        }

        StringBuilder escaped = new(raw.Length);
        bool inString = false;
        bool escapedCharacter = false;

        foreach (char character in raw)
        {
            if (escapedCharacter)
            {
                escaped.Append(character);
                escapedCharacter = false;
                continue;
            }

            if (character == '\\' && inString)
            {
                escaped.Append(character);
                escapedCharacter = true;
                continue;
            }

            if (character == '"')
            {
                inString = !inString;
                escaped.Append(character);
                continue;
            }

            if (inString && character < 0x20)
            {
                switch (character)
                {
                    case '\n':
                        escaped.Append("\\n");
                        break;
                    case '\r':
                        escaped.Append("\\r");
                        break;
                    case '\t':
                        escaped.Append("\\t");
                        break;
                    default:
                        break;
                }

                continue;
            }

            escaped.Append(character);
        }

        return JsonSerializer.Deserialize<T>(escaped.ToString(), Options);
    }

    [GeneratedRegex(@"```(?:json)?\s*([\s\S]*?)\s*```")]
    private static partial Regex FencedBlock();
}
