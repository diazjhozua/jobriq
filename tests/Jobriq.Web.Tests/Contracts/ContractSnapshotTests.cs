using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Jobriq.Web.Tests.Contracts;

public sealed class ContractSnapshotTests
{
    private static readonly Guid ExperienceId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid EducationId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid CertificationId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid AwardId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid ProjectId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly Guid UnknownApplicationId = Guid.Parse("99999999-9999-9999-9999-999999999999");

    [Fact]
    public async Task State_NewClient()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/api/state");

        await SnapshotAssert.MatchesJsonAsync("state-new-client", response);
    }

    [Fact]
    public async Task Profile_Save()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PutAsJsonAsync(
            "/api/profile",
            new { profile = CreateProfile() });

        await SnapshotAssert.MatchesJsonAsync("profile-save", response);
    }

    [Fact]
    public async Task Profile_Review()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/review",
            new { profile = CreateProfile() });

        await SnapshotAssert.MatchesJsonAsync("profile-review", response);
    }

    [Fact]
    public async Task StandaloneResume_Generate()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/resume",
            new { profile = CreateProfile(), jobDescription = "Build reliable systems." });

        await SnapshotAssert.MatchesJsonAsync("standalone-resume", response);
    }

    [Fact]
    public async Task Resume_Generate()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/resume/generate",
            new { profile = CreateProfile(), jobDescription = "Build reliable systems." });

        await SnapshotAssert.MatchesJsonAsync("resume-generate", response);
    }

    [Fact]
    public async Task Resume_ExportDocx()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/resume/export",
            new { resume = CreateGeneratedResume(), format = "docx" });

        response.Content.Headers.ContentDisposition!.FileName
            .ShouldBe("jane-doe-resume-20260102-030405.docx");

        await SnapshotAssert.MatchesBinaryAsync("resume-export-docx", response);
    }

    [Fact]
    public async Task Resume_ExportMarkdown()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/resume/export",
            new { resume = CreateGeneratedResume(), format = "markdown" });

        await SnapshotAssert.MatchesBinaryAsync("resume-export-markdown", response);
    }

    [Fact]
    public async Task Application_Create()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/applications",
            new
            {
                company = "Acme",
                role = "Engineer",
                jobDescription = "Build reliable systems.",
                status = "applied",
                appliedDate = "2022-08-01"
            });

        using JsonDocument document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Guid id = document.RootElement.GetProperty("application").GetProperty("id").GetGuid();
        response.Headers.Location!.ToString().ShouldEndWith($"/api/applications/{id}");

        await SnapshotAssert.MatchesJsonAsync("application-create", response);
    }

    [Fact]
    public async Task Application_UpdateDetails()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid id = await CreateApplicationAsync(client);

        HttpResponseMessage response = await client.PutAsJsonAsync(
            $"/api/applications/{id}",
            new { company = "Acme Labs", role = "Senior Engineer", appliedDate = "2022-09-01" });

        await SnapshotAssert.MatchesJsonAsync("application-update", response);
    }

    [Fact]
    public async Task Application_UpdateStatus()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid id = await CreateApplicationAsync(client);

        HttpResponseMessage response = await client.PatchAsJsonAsync(
            $"/api/applications/{id}/status",
            new { status = "interviewing" });

        await SnapshotAssert.MatchesJsonAsync("application-status", response);
    }

    [Fact]
    public async Task Application_Delete()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid id = await CreateApplicationAsync(client);

        HttpResponseMessage response = await client.DeleteAsync($"/api/applications/{id}");

        await SnapshotAssert.MatchesJsonAsync("application-delete", response);
    }

    [Fact]
    public async Task Application_SaveGeneratedResume()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid id = await CreateApplicationAsync(client);

        HttpResponseMessage response = await client.PutAsJsonAsync(
            $"/api/applications/{id}/generated-resume",
            new { resume = CreateGeneratedResume() });

        await SnapshotAssert.MatchesJsonAsync("application-resume", response);
    }

    [Fact]
    public async Task Application_GenerateCoverLetter()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        await client.PutAsJsonAsync("/api/profile", new { profile = CreateProfile() });
        Guid id = await CreateApplicationAsync(client);

        HttpResponseMessage response = await client.PostAsync(
            $"/api/applications/{id}/cover-letter",
            content: null);

        await SnapshotAssert.MatchesJsonAsync("application-cover-letter", response);
    }

    [Fact]
    public async Task CoverLetter_Export()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/cover-letter/export",
            new { letter = CreateCoverLetter() });

        response.Content.Headers.ContentDisposition!.FileName
            .ShouldBe("jane-doe-cover-letter-20260102-030405.docx");

        await SnapshotAssert.MatchesBinaryAsync("cover-letter-export", response);
    }

    [Fact]
    public async Task Problem_InvalidRequest_Profile()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PutAsJsonAsync(
            "/api/profile",
            new { profile = (object?)null });

        await SnapshotAssert.MatchesJsonAsync("problem-invalid-request-profile", response);
    }

    [Fact]
    public async Task Problem_InvalidRequest_AppliedDate()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/applications",
            new { company = "Acme", role = "Engineer", jobDescription = "", appliedDate = "August 2022" });

        await SnapshotAssert.MatchesJsonAsync("problem-invalid-request-date", response);
    }

    [Fact]
    public async Task Problem_ApplicationNotFound()
    {
        await using ContractWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PutAsJsonAsync(
            $"/api/applications/{UnknownApplicationId}",
            new { company = "Acme", role = "Engineer" });

        await SnapshotAssert.MatchesJsonAsync("problem-application-not-found", response);
    }

    [Fact]
    public async Task Problem_MissingApiKey()
    {
        await using MissingKeyWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/resume/generate",
            new { profile = CreateProfile() });

        await SnapshotAssert.MatchesJsonAsync("problem-missing-api-key", response);
    }

    [Fact]
    public async Task Problem_DatabaseUnavailable()
    {
        await using ContractWebFactory factory = new();
        factory.Repository.Unavailable = true;
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/api/state");

        await SnapshotAssert.MatchesJsonAsync("problem-database-unavailable", response);
    }

    private static async Task<Guid> CreateApplicationAsync(HttpClient client)
    {
        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/applications",
            new
            {
                company = "Acme",
                role = "Engineer",
                jobDescription = "Build reliable systems.",
                status = "saved"
            });

        response.EnsureSuccessStatusCode();

        using JsonDocument document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return document.RootElement.GetProperty("application").GetProperty("id").GetGuid();
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
                id = ExperienceId,
                company = "Acme",
                title = "Engineer",
                startDate = "Jan 2020",
                endDate = "Present",
                bullets = new[] { "Built a thing", "Fixed a thing" }
            }
        },
        education = new[]
        {
            new
            {
                id = EducationId,
                school = "State University",
                degree = "BS",
                field = "Computer Science",
                startDate = "2015",
                endDate = "2019",
                gpa = "3.8"
            }
        },
        certifications = new[]
        {
            new
            {
                id = CertificationId,
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
                id = AwardId,
                title = "Engineer of the Year",
                associatedWith = "Acme",
                issuer = "Acme",
                issueDate = "2023",
                description = "For reliability work."
            }
        },
        skills = new[] { "C#", "React" },
        projects = new[]
        {
            new
            {
                id = ProjectId,
                name = "Tool",
                url = "https://example.com/tool",
                startDate = "2021",
                endDate = "2022",
                associatedWith = "Personal Project",
                bullets = new[] { "Made it" }
            }
        }
    };

    private static object CreateGeneratedResume() => new
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
        summary = "Deterministic professional summary.",
        experience = new[]
        {
            new
            {
                id = ExperienceId,
                company = "Acme",
                title = "Engineer",
                startDate = "Jan 2020",
                endDate = "Present",
                bullets = new[]
                {
                    new { original = "Built a thing", enhanced = "Enhanced: Built a thing" },
                    new { original = "Fixed a thing", enhanced = "Enhanced: Fixed a thing" }
                }
            }
        },
        education = new[]
        {
            new
            {
                id = EducationId,
                school = "State University",
                degree = "BS",
                field = "Computer Science",
                startDate = "2015",
                endDate = "2019",
                gpa = "3.8"
            }
        },
        certifications = new[]
        {
            new
            {
                id = CertificationId,
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
                id = AwardId,
                title = "Engineer of the Year",
                associatedWith = "Acme",
                issuer = "Acme",
                issueDate = "2023",
                description = "For reliability work."
            }
        },
        skills = new[] { "C#", "React" },
        projects = new[]
        {
            new
            {
                id = ProjectId,
                name = "Tool",
                url = "https://example.com/tool",
                startDate = "2021",
                endDate = "2022",
                associatedWith = "Personal Project",
                bullets = new[] { new { original = "Made it", enhanced = "Enhanced: Made it" } }
            }
        },
        keywords = new { matched = new[] { "C#", "React" }, missing = new[] { "Kubernetes" } },
        generatedAt = "2026-01-02T03:04:05+00:00"
    };

    private static object CreateCoverLetter() => new
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
        company = "Acme",
        role = "Engineer",
        salutation = "Dear Acme Hiring Team,",
        paragraphs = new[] { "First paragraph.", "Second paragraph." },
        closing = "Sincerely,",
        signature = "Jane Doe",
        generatedAt = "2026-01-02T03:04:05+00:00"
    };
}
