using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Jobriq.Contracts;
using Shouldly;

namespace Jobriq.Web.Tests.Endpoints;

public sealed class PiiMaskingEndpointsTests
{
    [Fact]
    public async Task State_DefaultsToEnabled()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        using JsonDocument document = JsonDocument.Parse(
            await client.GetStringAsync("/api/state"));

        document.RootElement
            .GetProperty("piiMasking")
            .GetProperty("enabled")
            .GetBoolean()
            .ShouldBeTrue();
    }

    [Fact]
    public async Task Update_TogglesAndPersists()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PutAsJsonAsync(
            "/api/pii-masking",
            new { enabled = false });

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PiiMaskingDto? dto = await response.Content.ReadFromJsonAsync<PiiMaskingDto>();
        dto.ShouldNotBeNull();
        dto.Enabled.ShouldBeFalse();

        using JsonDocument state = JsonDocument.Parse(
            await client.GetStringAsync("/api/state"));
        state.RootElement
            .GetProperty("piiMasking")
            .GetProperty("enabled")
            .GetBoolean()
            .ShouldBeFalse();

        HttpResponseMessage enabled = await client.PutAsJsonAsync(
            "/api/pii-masking",
            new { enabled = true });
        PiiMaskingDto? enabledDto =
            await enabled.Content.ReadFromJsonAsync<PiiMaskingDto>();
        enabledDto.ShouldNotBeNull();
        enabledDto.Enabled.ShouldBeTrue();
    }

    [Fact]
    public async Task Update_WithoutEnabled_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PutAsJsonAsync(
            "/api/pii-masking",
            new { enabled = (bool?)null });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        string body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("invalid_request");
    }

    [Fact]
    public async Task Update_IsClientScoped()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient first = factory.CreateClient();
        using HttpClient second = factory.CreateClient();

        await first.PutAsJsonAsync("/api/pii-masking", new { enabled = false });

        using JsonDocument state = JsonDocument.Parse(
            await second.GetStringAsync("/api/state"));
        state.RootElement
            .GetProperty("piiMasking")
            .GetProperty("enabled")
            .GetBoolean()
            .ShouldBeTrue();
    }
}
