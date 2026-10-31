using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Shouldly;

namespace Jobriq.Web.Tests.Contracts;

internal static class SnapshotAssert
{
    private static readonly Regex GuidPattern = new(
        "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
        RegexOptions.Compiled);

    private static readonly Regex TimestampPattern = new(
        @"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:\d{2}|Z)",
        RegexOptions.Compiled);

    private static readonly Regex FileTimestampPattern = new(
        @"-\d{8}-\d{6}\.",
        RegexOptions.Compiled);

    private static readonly JsonSerializerOptions WriteOptions = new()
    {
        WriteIndented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    private static readonly string SnapshotDirectory = ResolveSnapshotDirectory();

    public static async Task MatchesJsonAsync(string name, HttpResponseMessage response)
    {
        string actual = await DescribeJsonAsync(response);
        await CompareAsync(name, actual);
    }

    public static async Task MatchesBinaryAsync(string name, HttpResponseMessage response)
    {
        string actual = await DescribeBinaryAsync(response);
        await CompareAsync(name, actual);
    }

    private static async Task CompareAsync(string name, string actual)
    {
        string path = Path.Combine(SnapshotDirectory, $"{name}.json");

        if (Environment.GetEnvironmentVariable("UPDATE_SNAPSHOTS") == "1")
        {
            Directory.CreateDirectory(SnapshotDirectory);
            await File.WriteAllTextAsync(path, actual + Environment.NewLine);
            return;
        }

        File.Exists(path).ShouldBeTrue(
            $"Snapshot '{name}' is missing. Run with UPDATE_SNAPSHOTS=1 to create it.");

        string expected = await File.ReadAllTextAsync(path);
        actual.ShouldBe(expected.TrimEnd('\r', '\n'));
    }

    private static async Task<string> DescribeJsonAsync(HttpResponseMessage response)
    {
        JsonNode? body = null;
        string raw = await response.Content.ReadAsStringAsync();
        if (!string.IsNullOrWhiteSpace(raw))
        {
            body = Canonicalize(JsonNode.Parse(raw));
        }

        JsonObject description = new()
        {
            ["status"] = (int)response.StatusCode,
            ["contentType"] = response.Content.Headers.ContentType?.ToString(),
            ["location"] = response.Headers.Location is { } location
                ? Normalize(location.ToString())
                : null,
            ["body"] = body
        };

        return description.ToJsonString(WriteOptions);
    }

    private static async Task<string> DescribeBinaryAsync(HttpResponseMessage response)
    {
        byte[] content = await response.Content.ReadAsByteArrayAsync();

        JsonObject description = new()
        {
            ["status"] = (int)response.StatusCode,
            ["contentType"] = response.Content.Headers.ContentType?.ToString(),
            ["contentDisposition"] = response.Content.Headers.ContentDisposition is { } disposition
                ? Normalize(disposition.ToString())
                : null,
            ["hasContent"] = content.Length > 0
        };

        return description.ToJsonString(WriteOptions);
    }

    private static JsonNode? Canonicalize(JsonNode? node)
    {
        switch (node)
        {
            case JsonObject jsonObject:
                JsonObject sorted = new();
                foreach (KeyValuePair<string, JsonNode?> property in
                         jsonObject.OrderBy(pair => pair.Key, StringComparer.Ordinal))
                {
                    sorted[property.Key] = property.Key == "traceId"
                        ? JsonValue.Create("<trace-id>")
                        : Canonicalize(property.Value);
                }

                return sorted;
            case JsonArray jsonArray:
                JsonArray array = [];
                foreach (JsonNode? item in jsonArray)
                {
                    array.Add(Canonicalize(item));
                }

                return array;
            case JsonValue value when value.TryGetValue(out string? text):
                return JsonValue.Create(Normalize(text));
            default:
                return node?.DeepClone();
        }
    }

    private static string Normalize(string value)
    {
        string normalized = GuidPattern.Replace(value, "<guid>");
        normalized = TimestampPattern.Replace(normalized, "<timestamp>");
        return FileTimestampPattern.Replace(normalized, "-<timestamp>.");
    }

    private static string ResolveSnapshotDirectory()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);

        while (directory is not null &&
               !File.Exists(Path.Combine(directory.FullName, "Jobriq.Web.Tests.csproj")))
        {
            directory = directory.Parent;
        }

        return Path.Combine(
            directory?.FullName ?? AppContext.BaseDirectory,
            "Contracts",
            "Snapshots");
    }
}
