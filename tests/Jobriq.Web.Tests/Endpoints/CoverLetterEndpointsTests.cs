using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;
using Shouldly;

namespace Jobriq.Web.Tests.Endpoints;

public sealed class CoverLetterEndpointsTests
{
    [Fact]
    public async Task Generate_CreatesLetterWithFakeAi()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        await SaveProfileAsync(client);
        Guid id = await CreateApplicationAsync(client);

        HttpResponseMessage response = await client.PostAsync(
            $"/api/applications/{id}/cover-letter",
            content: null);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonElement letter = (await ReadJsonAsync(response))
            .GetProperty("application")
            .GetProperty("coverLetter");
        letter.GetProperty("salutation").GetString().ShouldBe("Dear Acme Hiring Team,");
        letter.GetProperty("signature").GetString().ShouldBe("Jane Doe");
        letter.GetProperty("closing").GetString().ShouldBe("Sincerely,");
        letter.GetProperty("paragraphs").GetArrayLength().ShouldBeGreaterThan(0);
    }

    [Fact]
    public async Task Generate_RegeneratesAndReplacesLetter()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        await SaveProfileAsync(client);
        Guid id = await CreateApplicationAsync(client);

        await client.PostAsync($"/api/applications/{id}/cover-letter", content: null);
        HttpResponseMessage response = await client.PostAsync(
            $"/api/applications/{id}/cover-letter",
            content: null);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonElement state = await ReadJsonAsync(await client.GetAsync("/api/state"));
        JsonElement application = state.GetProperty("applications")[0];
        application.GetProperty("coverLetter").GetProperty("company").GetString()
            .ShouldBe("Acme");
    }

    [Fact]
    public async Task Generate_UnknownApplication_ReturnsNotFound()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        await SaveProfileAsync(client);

        HttpResponseMessage response = await client.PostAsync(
            $"/api/applications/{Guid.NewGuid()}/cover-letter",
            content: null);

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("application_not_found");
    }

    [Fact]
    public async Task Generate_WithoutProfileName_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid id = await CreateApplicationAsync(client);

        HttpResponseMessage response = await client.PostAsync(
            $"/api/applications/{id}/cover-letter",
            content: null);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("invalid_request");
        problem.GetProperty("detail").GetString().ShouldNotBeNull().ShouldContain("Add your name");
    }

    [Fact]
    public async Task Generate_WithoutApiKey_ReturnsActionableProblem()
    {
        await using MissingKeyWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsync(
            $"/api/applications/{Guid.NewGuid()}/cover-letter",
            content: null);

        response.StatusCode.ShouldBe(HttpStatusCode.ServiceUnavailable);
        string body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("missing_api_key");
        body.ShouldContain("OpenAI:ApiKey");
    }

    [Fact]
    public async Task Export_ReturnsDocxWithTimestampedName()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/cover-letter/export",
            new { letter = CreateLetter() });

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.ShouldBe(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        string? fileName = response.Content.Headers.ContentDisposition?.FileNameStar
            ?? response.Content.Headers.ContentDisposition?.FileName;
        fileName.ShouldNotBeNull();
        fileName.Trim('"').ShouldMatch(@"^jane-doe-cover-letter-\d{8}-\d{6}\.docx$");
        (await response.Content.ReadAsByteArrayAsync()).ShouldNotBeEmpty();
    }

    [Fact]
    public async Task Export_WithoutLetter_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/cover-letter/export",
            new { letter = (object?)null });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("invalid_request");
    }

    [Fact]
    public async Task Export_WithoutPersonalName_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        CoverLetter letter = CreateLetter();
        letter.Personal = new PersonalInfo();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/cover-letter/export",
            new { letter });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("invalid_request");
    }

    private static async Task SaveProfileAsync(HttpClient client)
    {
        HttpResponseMessage response = await client.PutAsJsonAsync(
            "/api/profile",
            new
            {
                profile = new ResumeProfile
                {
                    Personal = new PersonalInfo
                    {
                        Name = "Jane Doe",
                        Email = "jane@example.com"
                    },
                    Experience =
                    [
                        new WorkExperience
                        {
                            Company = "Globex",
                            Title = "Developer",
                            StartDate = "2022",
                            EndDate = "Present",
                            Bullets = ["Shipped a tool"]
                        }
                    ],
                    Skills = ["C#"]
                }
            });

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    private static async Task<Guid> CreateApplicationAsync(HttpClient client)
    {
        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/applications",
            new
            {
                company = "Acme",
                role = "Engineer",
                jobDescription = "Build reliable systems."
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        JsonElement application = (await ReadJsonAsync(response)).GetProperty("application");

        return application.GetProperty("id").GetGuid();
    }

    private static CoverLetter CreateLetter() => new()
    {
        Personal = new PersonalInfo { Name = "Jane Doe", Email = "jane@example.com" },
        Company = "Acme",
        Role = "Engineer",
        Salutation = "Dear Acme Hiring Team,",
        Paragraphs = ["First paragraph.", "Second paragraph."],
        Closing = "Sincerely,",
        Signature = "Jane Doe",
        GeneratedAt = new DateTimeOffset(2026, 10, 26, 12, 0, 0, TimeSpan.Zero)
    };

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response)
    {
        string json = await response.Content.ReadAsStringAsync();
        using JsonDocument document = JsonDocument.Parse(json);

        return document.RootElement.Clone();
    }
}
