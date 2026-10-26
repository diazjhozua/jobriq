using System.Text.Json;
using System.Text.Json.Serialization;

namespace Jobriq.Infrastructure.Persistence.Postgres;

internal static class JobriqJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
        WriteIndented = false
    };
}
