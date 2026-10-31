using System.Globalization;

namespace Jobriq.Application.Common.Dates;

public static class AppliedDateParser
{
    public static bool TryParse(string? raw, out DateOnly? appliedDate)
    {
        appliedDate = null;

        if (string.IsNullOrWhiteSpace(raw))
        {
            return true;
        }

        if (!DateOnly.TryParseExact(
                raw,
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out DateOnly parsed))
        {
            return false;
        }

        appliedDate = parsed;
        return true;
    }
}
