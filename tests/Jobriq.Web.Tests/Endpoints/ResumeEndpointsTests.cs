using System.Net;
using System.Net.Http.Json;
using Jobriq.Domain.Resumes;
using Shouldly;

namespace Jobriq.Web.Tests.Endpoints;

public sealed class ResumeEndpointsTests
{
    [Fact]
    public async Task Generate_ReturnsEnhancedResumeWithFakeAi()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/resume/generate",
            CreateGenerateRequest("Jane Doe"));

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        GeneratedResume? resume = await response.Content.ReadFromJsonAsync<GeneratedResume>();
        resume.ShouldNotBeNull();
        resume.Personal.Name.ShouldBe("Jane Doe");
        resume.Summary.ShouldBe("Deterministic professional summary.");
        resume.Experience.Single().Bullets.Single().Enhanced.ShouldBe("Enhanced: Built a thing");
        resume.Projects.Single().Bullets.Single().Enhanced.ShouldBe("Enhanced: Shipped a tool");
        resume.Keywords.ShouldNotBeNull();
        resume.Keywords!.Matched.ShouldBe(["C#", "React"]);
        resume.Keywords.Missing.ShouldBe(["Kubernetes"]);
    }

    [Fact]
    public async Task Generate_KeepsRequestsIndependent()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        GeneratedResume? first = await (await client.PostAsJsonAsync(
            "/api/resume/generate",
            CreateGenerateRequest("Jane Doe"))).Content.ReadFromJsonAsync<GeneratedResume>();
        GeneratedResume? second = await (await client.PostAsJsonAsync(
            "/api/resume/generate",
            CreateGenerateRequest("John Smith"))).Content.ReadFromJsonAsync<GeneratedResume>();

        first!.Personal.Name.ShouldBe("Jane Doe");
        second!.Personal.Name.ShouldBe("John Smith");
    }

    [Theory]
    [InlineData("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx")]
    [InlineData("markdown", "text/markdown; charset=utf-8", ".md")]
    public async Task Export_ReturnsFileWithCliName(
        string format,
        string contentType,
        string extension)
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/resume/export",
            new { resume = CreateResume(), format });

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.ShouldBe(contentType.Split(';')[0]);
        response.Content.Headers.ContentType?.CharSet.ShouldBe(
            contentType.Contains("charset=utf-8", StringComparison.Ordinal) ? "utf-8" : null);
        string? fileName = response.Content.Headers.ContentDisposition?.FileNameStar
            ?? response.Content.Headers.ContentDisposition?.FileName;
        fileName.ShouldNotBeNull();
        fileName.Trim('"').ShouldMatch($@"^jane-doe-resume-\d{{8}}-\d{{6}}{extension}$");

        byte[] bytes = await response.Content.ReadAsByteArrayAsync();
        bytes.ShouldNotBeEmpty();
    }

    [Fact]
    public async Task Generate_WithoutApiKey_ReturnsActionableProblem()
    {
        await using MissingKeyWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/resume/generate",
            CreateGenerateRequest("Jane Doe"));

        response.StatusCode.ShouldBe(HttpStatusCode.ServiceUnavailable);
        string body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("missing_api_key");
        body.ShouldContain("OpenAI:ApiKey");
    }

    private static object CreateGenerateRequest(string name) => new
    {
        profile = new
        {
            personal = new
            {
                name,
                email = "jane@example.com",
                phone = string.Empty,
                location = string.Empty,
                linkedin = string.Empty,
                github = string.Empty,
                website = string.Empty
            },
            summaryType = "professional",
            summary = string.Empty,
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
            skills = new[] { "C#" },
            projects = new[]
            {
                new
                {
                    id = Guid.NewGuid(),
                    name = "Tool",
                    url = "https://example.com/tool",
                    bullets = new[] { "Shipped a tool" }
                }
            }
        },
        jobDescription = "Need C# and React."
    };

    private static GeneratedResume CreateResume() => new()
    {
        Personal = new PersonalInfo
        {
            Name = "Jane Doe",
            Email = "jane@example.com"
        },
        Summary = "Built reliable systems.",
        Skills = ["C#"],
        GeneratedAt = new DateTimeOffset(2026, 10, 24, 12, 0, 0, TimeSpan.Zero)
    };
}
