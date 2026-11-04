using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Jobriq.Web.Tests.Endpoints;

public sealed class ProfileExportEndpointsTests
{
    [Fact]
    public async Task Export_ReturnsTemplateWithTimestampedName()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/export",
            new { profile = CreateProfile() });

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.ShouldBe("text/plain");
        response.Content.Headers.ContentType?.CharSet.ShouldBe("utf-8");
        string? fileName = response.Content.Headers.ContentDisposition?.FileNameStar
            ?? response.Content.Headers.ContentDisposition?.FileName;
        fileName.ShouldNotBeNull();
        fileName.Trim('"').ShouldMatch(@"^jane-doe-profile-\d{8}-\d{6}\.txt$");

        string body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("[PERSONAL]");
        body.ShouldContain("Name: Jane Doe");
        body.ShouldContain("[EXPERIENCE]");
        body.ShouldContain("- Built a thing");
        body.ShouldContain("[SKILLS]");
        body.ShouldContain("C#, React");
        body.ShouldNotContain("[EDUCATION]");
        body.ShouldNotContain("[PROJECT]");
    }

    [Fact]
    public async Task Export_DoesNotPersistProfile()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        await client.PostAsJsonAsync("/api/profile/export", new { profile = CreateProfile() });

        factory.Repository.SavedProfileCount.ShouldBe(0);
    }

    [Fact]
    public async Task Export_WithoutProfile_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/export",
            new { profile = (object?)null });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("invalid_request");
        problem.GetProperty("detail").GetString().ShouldNotBeNull()
            .ShouldContain("A complete profile is required.");
    }

    [Fact]
    public async Task Export_EmptyProfile_ReturnsCanonicalSections()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/export",
            new
            {
                profile = new
                {
                    personal = new { },
                    summaryType = "professional",
                    summary = "",
                    experience = Array.Empty<object>(),
                    education = Array.Empty<object>(),
                    certifications = Array.Empty<object>(),
                    awards = Array.Empty<object>(),
                    skills = Array.Empty<string>(),
                    projects = Array.Empty<object>()
                }
            });

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("[PERSONAL]");
        body.ShouldContain("[SUMMARY]");
        body.ShouldContain("[SKILLS]");
    }

    private static object CreateProfile() => new
    {
        personal = new
        {
            name = "Jane Doe",
            email = "jane@example.com",
            phone = "555-0100",
            location = "Remote",
            linkedin = "https://linkedin.com/in/janedoe",
            github = "https://github.com/janedoe",
            website = "https://janedoe.dev"
        },
        summaryType = "professional",
        summary = "",
        experience = new[]
        {
            new
            {
                id = Guid.NewGuid(),
                company = "Acme",
                title = "Engineer",
                startDate = "Jan 2020",
                endDate = "Present",
                bullets = new[] { "Built a thing" },
                skillsGained = new[] { "Docker" }
            }
        },
        education = Array.Empty<object>(),
        certifications = Array.Empty<object>(),
        awards = Array.Empty<object>(),
        skills = new[] { "C#", "React" },
        projects = Array.Empty<object>()
    };

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response)
    {
        string json = await response.Content.ReadAsStringAsync();
        using JsonDocument document = JsonDocument.Parse(json);

        return document.RootElement.Clone();
    }
}
