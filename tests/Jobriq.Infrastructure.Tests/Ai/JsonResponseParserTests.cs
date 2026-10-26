using System.Text.Json;
using Jobriq.Infrastructure.Ai;
using Shouldly;

namespace Jobriq.Infrastructure.Tests.Ai;

public sealed class JsonResponseParserTests
{
    private sealed class Payload
    {
        public string? Value { get; set; }

        public bool Flag { get; set; }
    }

    [Fact]
    public void Parse_ReadsPlainJson()
    {
        Payload? payload = JsonResponseParser.Parse<Payload>("""{"value":"hello","flag":true}""");

        payload.ShouldNotBeNull();
        payload.Value.ShouldBe("hello");
        payload.Flag.ShouldBeTrue();
    }

    [Fact]
    public void Parse_StripsFencedCodeBlock()
    {
        string content = """
            ```json
            {"value":"hello","flag":false}
            ```
            """;

        Payload? payload = JsonResponseParser.Parse<Payload>(content);

        payload.ShouldNotBeNull();
        payload.Value.ShouldBe("hello");
    }

    [Fact]
    public void Parse_ExtractsJsonFromSurroundingText()
    {
        Payload? payload = JsonResponseParser.Parse<Payload>(
            """Here is the result: {"value":"hello","flag":true} Let me know if you need changes.""");

        payload.ShouldNotBeNull();
        payload.Value.ShouldBe("hello");
        payload.Flag.ShouldBeTrue();
    }

    [Fact]
    public void Parse_EscapesLiteralControlCharactersInsideStrings()
    {
        string content = "{\"value\":\"line one\nline two\ttabbed\",\"flag\":true}";

        Payload? payload = JsonResponseParser.Parse<Payload>(content);

        payload.ShouldNotBeNull();
        payload.Value.ShouldBe("line one\nline two\ttabbed");
    }

    [Fact]
    public void Parse_PreservesEscapedCharacters()
    {
        Payload? payload = JsonResponseParser.Parse<Payload>(
            """{"value":"quote: \" and newline: \n","flag":true}""");

        payload.ShouldNotBeNull();
        payload.Value.ShouldBe("quote: \" and newline: \n");
    }

    [Fact]
    public void Parse_ThrowsOnMalformedJson()
    {
        Should.Throw<JsonException>(() => JsonResponseParser.Parse<Payload>("{not json"));
    }
}
