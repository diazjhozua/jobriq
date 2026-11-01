using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Jobriq.Web.Tests.Endpoints;

public sealed class PromptStyleEndpointsTests
{
    [Fact]
    public async Task Create_ReturnsCreatedWithTheFirstStyleActive()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/prompt-styles",
            new { name = "Warm voice", instructions = "Be warm." });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        JsonElement styles = await ReadJsonAsync(response);
        JsonElement style = styles.GetProperty("styles")[0];
        Guid id = style.GetProperty("id").GetGuid();

        style.GetProperty("name").GetString().ShouldBe("Warm voice");
        style.GetProperty("instructions").GetString().ShouldBe("Be warm.");
        style.GetProperty("isActive").GetBoolean().ShouldBeTrue();
        styles.GetProperty("activeStyleId").GetGuid().ShouldBe(id);
        styles.GetProperty("baseline").GetProperty("id").GetGuid()
            .ShouldBe(Guid.Parse("00000000-0000-0000-0000-000000000001"));
        styles.GetProperty("baseline").GetProperty("isActive").GetBoolean()
            .ShouldBeFalse();
    }

    [Fact]
    public async Task Create_DuplicateName_ReturnsConflict()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        await CreateStyleAsync(client, "Warm voice");

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/prompt-styles",
            new { name = "warm voice", instructions = "Again." });

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("prompt_style_name_conflict");
    }

    [Fact]
    public async Task Create_WithoutName_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/prompt-styles",
            new { name = "", instructions = "Be warm." });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("invalid_request");
    }

    [Fact]
    public async Task Update_ReturnsUpdatedStyle()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid id = await CreateStyleAsync(client, "Warm voice");

        HttpResponseMessage response = await client.PutAsJsonAsync(
            $"/api/prompt-styles/{id}",
            new { name = "Warmer voice", instructions = "Be warmer." });

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonElement style = (await ReadJsonAsync(response)).GetProperty("styles")[0];
        style.GetProperty("name").GetString().ShouldBe("Warmer voice");
        style.GetProperty("instructions").GetString().ShouldBe("Be warmer.");
    }

    [Fact]
    public async Task Update_UnknownStyle_ReturnsNotFound()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PutAsJsonAsync(
            $"/api/prompt-styles/{Guid.NewGuid()}",
            new { name = "Warmer voice", instructions = "Be warmer." });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("prompt_style_not_found");
    }

    [Fact]
    public async Task Activate_SwitchesTheActiveStyle()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid first = await CreateStyleAsync(client, "Warm voice");
        Guid second = await CreateStyleAsync(client, "Terse voice");

        HttpResponseMessage response = await client.PostAsync(
            $"/api/prompt-styles/{second}/activate",
            content: null);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonElement styles = await ReadJsonAsync(response);
        styles.GetProperty("activeStyleId").GetGuid().ShouldBe(second);
        styles.GetProperty("styles")[0].GetProperty("isActive").GetBoolean().ShouldBeFalse();
        styles.GetProperty("styles")[1].GetProperty("isActive").GetBoolean().ShouldBeTrue();
        styles.GetProperty("styles")[0].GetProperty("id").GetGuid().ShouldBe(first);
    }

    [Fact]
    public async Task Activate_UnknownStyle_ReturnsNotFound()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsync(
            $"/api/prompt-styles/{Guid.NewGuid()}/activate",
            content: null);

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("prompt_style_not_found");
    }

    [Fact]
    public async Task Delete_RemovesTheStyleAndFallsBackToTheBaseline()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid id = await CreateStyleAsync(client, "Warm voice");

        HttpResponseMessage response = await client.DeleteAsync($"/api/prompt-styles/{id}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonElement styles = await ReadJsonAsync(response);
        styles.GetProperty("styles").GetArrayLength().ShouldBe(0);
        styles.GetProperty("activeStyleId").ValueKind.ShouldBe(JsonValueKind.Null);
        styles.GetProperty("baseline").GetProperty("isActive").GetBoolean().ShouldBeTrue();
    }

    [Fact]
    public async Task Delete_UnknownStyle_ReturnsNotFound()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.DeleteAsync(
            $"/api/prompt-styles/{Guid.NewGuid()}");

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("prompt_style_not_found");
    }

    [Fact]
    public async Task Clients_WithDifferentCookies_AreIsolated()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient firstClient = factory.CreateClient();
        using HttpClient secondClient = factory.CreateClient();

        await CreateStyleAsync(firstClient, "Warm voice");

        JsonElement firstState = await ReadJsonAsync(await firstClient.GetAsync("/api/state"));
        JsonElement secondState = await ReadJsonAsync(await secondClient.GetAsync("/api/state"));

        firstState.GetProperty("promptStyles").GetProperty("styles").GetArrayLength()
            .ShouldBe(1);
        secondState.GetProperty("promptStyles").GetProperty("styles").GetArrayLength()
            .ShouldBe(0);
    }

    private static async Task<Guid> CreateStyleAsync(HttpClient client, string name)
    {
        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/prompt-styles",
            new { name, instructions = "Be warm." });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        JsonElement styles = await ReadJsonAsync(response);

        return styles.GetProperty("styles")
            .EnumerateArray()
            .Single(style => style.GetProperty("name").GetString() == name)
            .GetProperty("id")
            .GetGuid();
    }

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response)
    {
        string json = await response.Content.ReadAsStringAsync();
        using JsonDocument document = JsonDocument.Parse(json);

        return document.RootElement.Clone();
    }
}
