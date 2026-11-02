using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Jobriq.Web.Tests.Endpoints;

public sealed class ResumeThemeEndpointsTests
{
    private static readonly Guid ClassicId =
        Guid.Parse("00000000-0000-0000-0000-0000000000A1");
    private static readonly Guid ModernId =
        Guid.Parse("00000000-0000-0000-0000-0000000000A2");

    [Fact]
    public async Task Create_ReturnsCreatedWithoutActivatingTheTheme()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/resume-themes",
            new { name = "My theme", styles = Styles() });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        JsonElement themes = await ReadJsonAsync(response);
        JsonElement theme = themes.GetProperty("themes")[0];

        theme.GetProperty("name").GetString().ShouldBe("My theme");
        theme.GetProperty("isActive").GetBoolean().ShouldBeFalse();
        theme.GetProperty("isBuiltIn").GetBoolean().ShouldBeFalse();
        theme.GetProperty("styles").GetProperty("bodyFont").GetString().ShouldBe("Georgia");
        themes.GetProperty("activeThemeId").GetGuid().ShouldBe(ClassicId);
        themes.GetProperty("builtIns").GetArrayLength().ShouldBe(5);
    }

    [Fact]
    public async Task Create_ReservedName_ReturnsConflict()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/resume-themes",
            new { name = "modern", styles = Styles() });

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("resume_theme_name_conflict");
    }

    [Fact]
    public async Task Create_DuplicateName_ReturnsConflict()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        await CreateThemeAsync(client, "My theme");

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/resume-themes",
            new { name = "my theme", styles = Styles() });

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("resume_theme_name_conflict");
    }

    [Fact]
    public async Task Create_UnsupportedFont_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/resume-themes",
            new { name = "My theme", styles = Styles(bodyFont: "Comic Sans MS") });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("invalid_request");
    }

    [Fact]
    public async Task Update_ChangesTheCustomTheme()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid id = await CreateThemeAsync(client, "My theme");

        HttpResponseMessage response = await client.PutAsJsonAsync(
            $"/api/resume-themes/{id}",
            new { name = "Renamed", styles = Styles() });

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonElement theme = (await ReadJsonAsync(response)).GetProperty("themes")[0];
        theme.GetProperty("name").GetString().ShouldBe("Renamed");
    }

    [Fact]
    public async Task Update_BuiltInTheme_ReturnsReadOnly()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PutAsJsonAsync(
            $"/api/resume-themes/{ClassicId}",
            new { name = "Classic", styles = Styles() });

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("resume_theme_read_only");
    }

    [Fact]
    public async Task Update_UnknownTheme_ReturnsNotFound()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PutAsJsonAsync(
            $"/api/resume-themes/{Guid.NewGuid()}",
            new { name = "Renamed", styles = Styles() });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("resume_theme_not_found");
    }

    [Fact]
    public async Task Activate_SwitchesBetweenBuiltInAndCustomThemes()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid customId = await CreateThemeAsync(client, "My theme");

        HttpResponseMessage builtInResponse = await client.PostAsync(
            $"/api/resume-themes/{ModernId}/activate",
            content: null);

        builtInResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonElement builtInThemes = await ReadJsonAsync(builtInResponse);
        builtInThemes.GetProperty("activeThemeId").GetGuid().ShouldBe(ModernId);
        builtInThemes.GetProperty("builtIns")
            .EnumerateArray()
            .Single(theme => theme.GetProperty("isActive").GetBoolean())
            .GetProperty("id")
            .GetGuid()
            .ShouldBe(ModernId);

        HttpResponseMessage customResponse = await client.PostAsync(
            $"/api/resume-themes/{customId}/activate",
            content: null);

        customResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonElement customThemes = await ReadJsonAsync(customResponse);
        customThemes.GetProperty("activeThemeId").GetGuid().ShouldBe(customId);
        customThemes.GetProperty("themes")[0].GetProperty("isActive").GetBoolean()
            .ShouldBeTrue();
    }

    [Fact]
    public async Task Activate_UnknownTheme_ReturnsNotFound()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsync(
            $"/api/resume-themes/{Guid.NewGuid()}/activate",
            content: null);

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("resume_theme_not_found");
    }

    [Fact]
    public async Task Delete_ActiveCustomTheme_FallsBackToClassic()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid id = await CreateThemeAsync(client, "My theme");
        await client.PostAsync($"/api/resume-themes/{id}/activate", content: null);

        HttpResponseMessage response = await client.DeleteAsync($"/api/resume-themes/{id}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonElement themes = await ReadJsonAsync(response);
        themes.GetProperty("themes").GetArrayLength().ShouldBe(0);
        themes.GetProperty("activeThemeId").GetGuid().ShouldBe(ClassicId);
    }

    [Fact]
    public async Task Delete_BuiltInTheme_ReturnsReadOnly()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.DeleteAsync($"/api/resume-themes/{ModernId}");

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("resume_theme_read_only");
    }

    [Fact]
    public async Task Clients_WithDifferentCookies_AreIsolated()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient firstClient = factory.CreateClient();
        using HttpClient secondClient = factory.CreateClient();

        await CreateThemeAsync(firstClient, "My theme");
        await firstClient.PostAsync($"/api/resume-themes/{ModernId}/activate", content: null);

        JsonElement firstState = await ReadJsonAsync(await firstClient.GetAsync("/api/state"));
        JsonElement secondState = await ReadJsonAsync(await secondClient.GetAsync("/api/state"));

        firstState.GetProperty("resumeThemes").GetProperty("themes").GetArrayLength()
            .ShouldBe(1);
        firstState.GetProperty("resumeThemes").GetProperty("activeThemeId").GetGuid()
            .ShouldBe(ModernId);
        secondState.GetProperty("resumeThemes").GetProperty("themes").GetArrayLength()
            .ShouldBe(0);
        secondState.GetProperty("resumeThemes").GetProperty("activeThemeId").GetGuid()
            .ShouldBe(ClassicId);
    }

    private static object Styles(string bodyFont = "Georgia") => new
    {
        nameFont = "Georgia",
        bodyFont,
        textColor = "#222222",
        mutedColor = "#666666",
        headingColor = "#1F3A5F",
        ruleColor = "#C9B99A",
        bodySize = 11,
        smallSize = 10,
        headingSize = 13,
        nameSize = 20,
        pageMargin = 72,
        showRules = true
    };

    private static async Task<Guid> CreateThemeAsync(HttpClient client, string name)
    {
        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/resume-themes",
            new { name, styles = Styles() });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        JsonElement themes = await ReadJsonAsync(response);

        return themes.GetProperty("themes")
            .EnumerateArray()
            .Single(theme => theme.GetProperty("name").GetString() == name)
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
