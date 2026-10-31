using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Jobriq.Web.Tests.Endpoints;

public sealed class StandaloneResumeEndpointsTests
{
    [Fact]
    public async Task Generate_ReturnsDeterministicResumeAndPersistsIt()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/resume",
            CreateRequest());

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonElement resume = await ReadJsonAsync(response);
        resume.GetProperty("summary").GetString().ShouldBe("Summary.");
        resume.GetProperty("experience")[0]
            .GetProperty("bullets")[0]
            .GetProperty("enhanced")
            .GetString()
            .ShouldBe("Enhanced: Built a thing");
        resume.GetProperty("keywords").ValueKind.ShouldBe(JsonValueKind.Null);
        resume.GetProperty("certifications")[0].GetProperty("name").GetString()
            .ShouldBe("AWS Solutions Architect");
        resume.GetProperty("certifications")[0].GetProperty("credentialId").GetString()
            .ShouldBe("ABC-123");
        resume.GetProperty("awards")[0].GetProperty("title").GetString()
            .ShouldBe("Engineer of the Year");

        JsonElement state = await ReadJsonAsync(await client.GetAsync("/api/state"));
        state.GetProperty("standaloneResume").GetProperty("summary").GetString().ShouldBe("Summary.");
        state.GetProperty("standaloneResume").GetProperty("certifications")[0]
            .GetProperty("name").GetString().ShouldBe("AWS Solutions Architect");
        state.GetProperty("standaloneResume").GetProperty("awards")[0]
            .GetProperty("title").GetString().ShouldBe("Engineer of the Year");
        state.GetProperty("applications").GetArrayLength().ShouldBe(0);
    }

    [Fact]
    public async Task Generate_WithJobDescription_ReturnsKeywords()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/resume",
            CreateRequest(jobDescription: "Build reliable systems."));

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonElement keywords = (await ReadJsonAsync(response)).GetProperty("keywords");
        keywords.GetProperty("matched").EnumerateArray()
            .Select(item => item.GetString())
            .ShouldBe(["C#", "React"]);
        keywords.GetProperty("missing").EnumerateArray()
            .Select(item => item.GetString())
            .ShouldBe(["Kubernetes"]);
    }

    [Fact]
    public async Task Generate_DoesNotPersistTheProfile()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/resume",
            CreateRequest());
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        JsonElement state = await ReadJsonAsync(await client.GetAsync("/api/state"));
        state.GetProperty("profile").GetProperty("summary").GetString().ShouldBeEmpty();
        state.GetProperty("profile").GetProperty("experience").GetArrayLength().ShouldBe(0);
    }

    [Fact]
    public async Task Generate_WithoutProfile_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/resume",
            new { profile = (object?)null });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("invalid_request");
    }

    [Fact]
    public async Task Generate_WithNullAwards_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/resume",
            new
            {
                profile = new
                {
                    certifications = Array.Empty<object>(),
                    awards = (object?)null
                }
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("invalid_request");
    }

    [Fact]
    public async Task Generate_WithoutApiKey_ReturnsMissingKeyProblem()
    {
        await using MissingKeyWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/resume",
            CreateRequest());

        response.StatusCode.ShouldBe(HttpStatusCode.ServiceUnavailable);
        string body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("missing_api_key");
    }

    private static object CreateRequest(string? jobDescription = null) => new
    {
        profile = new
        {
            personal = new
            {
                name = "Jane Doe",
                email = "jane@example.com",
                phone = string.Empty,
                location = string.Empty,
                linkedin = string.Empty,
                github = string.Empty,
                website = string.Empty
            },
            summaryType = "professional",
            summary = "Summary.",
            experience = new[]
            {
                new
                {
                    id = Guid.NewGuid(),
                    company = "Acme",
                    title = "Engineer",
                    startDate = "2022",
                    endDate = "Present",
                    bullets = new[] { "Built a thing" }
                }
            },
            education = Array.Empty<object>(),
            certifications = new[]
            {
                new
                {
                    id = Guid.NewGuid(),
                    name = "AWS Solutions Architect",
                    issuingOrganization = "Amazon Web Services",
                    issueDate = "Mar 2024",
                    expirationDate = "Mar 2027",
                    credentialId = "ABC-123",
                    credentialUrl = "https://example.com/verify/ABC-123"
                }
            },
            awards = new[]
            {
                new
                {
                    id = Guid.NewGuid(),
                    title = "Engineer of the Year",
                    associatedWith = "Acme",
                    issuer = "IEEE",
                    issueDate = "Dec 2023",
                    description = "Recognized for reliability work."
                }
            },
            skills = new[] { "C#" },
            projects = Array.Empty<object>()
        },
        jobDescription
    };

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response)
    {
        using JsonDocument document = JsonDocument.Parse(
            await response.Content.ReadAsStringAsync());

        return document.RootElement.Clone();
    }
}
