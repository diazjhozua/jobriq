using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Jobriq.Domain.Resumes;
using Microsoft.AspNetCore.Mvc.Testing;
using Shouldly;

namespace Jobriq.Web.Tests.Endpoints;

public sealed class DataEndpointsTests
{
    [Fact]
    public async Task GetState_NewClient_ReturnsEmptyStateAndSetsClientCookie()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient(
            new WebApplicationFactoryClientOptions { HandleCookies = false });

        HttpResponseMessage response = await client.GetAsync("/api/state");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        string setCookie = response.Headers.GetValues("Set-Cookie").Single();
        setCookie.ShouldStartWith("jobriq_client=");
        setCookie.ShouldContain("httponly", Case.Insensitive);
        setCookie.ShouldContain("samesite=lax", Case.Insensitive);
        Guid.TryParse(setCookie["jobriq_client=".Length..].Split(';')[0], out Guid clientId)
            .ShouldBeTrue();
        clientId.ShouldNotBe(Guid.Empty);

        JsonElement state = await ReadJsonAsync(response);
        state.GetProperty("profile").GetProperty("summary").GetString().ShouldBe(string.Empty);
        state.GetProperty("applications").GetArrayLength().ShouldBe(0);
    }

    [Fact]
    public async Task SaveProfile_ThenGetState_ReturnsSavedProfile()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage saveResponse = await client.PutAsJsonAsync(
            "/api/profile",
            new { profile = new ResumeProfile { Summary = "Saved summary." } });

        saveResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonElement saved = await ReadJsonAsync(saveResponse);
        saved.GetProperty("profile").GetProperty("summary").GetString().ShouldBe("Saved summary.");

        JsonElement state = await ReadJsonAsync(await client.GetAsync("/api/state"));
        state.GetProperty("profile").GetProperty("summary").GetString().ShouldBe("Saved summary.");
    }

    [Fact]
    public async Task SaveProfile_RoundTripsCertificationsAndAwards()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage saveResponse = await client.PutAsJsonAsync(
            "/api/profile",
            new
            {
                profile = new
                {
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
                    }
                }
            });

        saveResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        JsonElement state = await ReadJsonAsync(await client.GetAsync("/api/state"));
        JsonElement profile = state.GetProperty("profile");
        profile.GetProperty("certifications")[0].GetProperty("name").GetString()
            .ShouldBe("AWS Solutions Architect");
        profile.GetProperty("certifications")[0].GetProperty("credentialId").GetString()
            .ShouldBe("ABC-123");
        profile.GetProperty("awards")[0].GetProperty("title").GetString()
            .ShouldBe("Engineer of the Year");
        profile.GetProperty("awards")[0].GetProperty("issuer").GetString()
            .ShouldBe("IEEE");
    }

    [Fact]
    public async Task SaveProfile_WithoutProfile_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PutAsJsonAsync("/api/profile", new { profile = (object?)null });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("invalid_request");
    }

    [Fact]
    public async Task SaveProfile_WithNullCertifications_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PutAsJsonAsync(
            "/api/profile",
            new
            {
                profile = new
                {
                    certifications = (object?)null,
                    awards = Array.Empty<object>()
                }
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("invalid_request");
    }

    [Fact]
    public async Task CreateApplication_ReturnsCreatedWithLocation()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/applications",
            new
            {
                company = "Acme",
                role = "Engineer",
                jobDescription = "Build things.",
                status = "applied"
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        JsonElement application = (await ReadJsonAsync(response)).GetProperty("application");
        Guid id = application.GetProperty("id").GetGuid();
        application.GetProperty("company").GetString().ShouldBe("Acme");
        application.GetProperty("status").GetString().ShouldBe("applied");
        response.Headers.Location.ShouldNotBeNull();
        response.Headers.Location!.OriginalString.ShouldContain($"/api/applications/{id}");
    }

    [Fact]
    public async Task CreateApplication_StoresAppliedDate()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/applications",
            new
            {
                company = "Acme",
                role = "Engineer",
                jobDescription = "Build things.",
                appliedDate = "2022-08-01"
            });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        JsonElement application = (await ReadJsonAsync(response)).GetProperty("application");
        application.GetProperty("appliedDate").GetString().ShouldBe("2022-08-01");
    }

    [Fact]
    public async Task CreateApplication_InvalidAppliedDate_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/applications",
            new
            {
                company = "Acme",
                role = "Engineer",
                jobDescription = "Build things.",
                appliedDate = "August 2022"
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("invalid_request");
    }

    [Fact]
    public async Task CreateApplication_WithoutCompany_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/applications",
            new { company = "", role = "Engineer", jobDescription = "" });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("invalid_request");
    }

    [Fact]
    public async Task UpdateStatus_ReturnsUpdatedApplication()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid id = await CreateApplicationAsync(client);

        HttpResponseMessage response = await client.PatchAsync(
            $"/api/applications/{id}/status",
            JsonContent.Create(new { status = "interviewing" }));

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonElement application = (await ReadJsonAsync(response)).GetProperty("application");
        application.GetProperty("id").GetGuid().ShouldBe(id);
        application.GetProperty("status").GetString().ShouldBe("interviewing");
    }

    [Fact]
    public async Task UpdateApplicationDetails_UpdatesCompanyRoleAndAppliedDate()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid id = await CreateApplicationAsync(client);

        HttpResponseMessage response = await client.PutAsJsonAsync(
            $"/api/applications/{id}",
            new
            {
                company = "Globex",
                role = "Developer",
                appliedDate = "2022-08-01"
            });

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonElement application = (await ReadJsonAsync(response)).GetProperty("application");
        application.GetProperty("company").GetString().ShouldBe("Globex");
        application.GetProperty("role").GetString().ShouldBe("Developer");
        application.GetProperty("appliedDate").GetString().ShouldBe("2022-08-01");
    }

    [Fact]
    public async Task UpdateApplicationDetails_InvalidAppliedDate_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid id = await CreateApplicationAsync(client);

        HttpResponseMessage response = await client.PutAsJsonAsync(
            $"/api/applications/{id}",
            new
            {
                company = "Globex",
                role = "Developer",
                appliedDate = "August 2022"
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("invalid_request");
    }

    [Fact]
    public async Task UpdateApplicationDetails_UnknownApplication_ReturnsNotFound()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PutAsJsonAsync(
            $"/api/applications/{Guid.NewGuid()}",
            new { company = "Globex", role = "Developer" });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("application_not_found");
    }

    [Fact]
    public async Task UpdateStatus_UnknownApplication_ReturnsNotFound()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PatchAsync(
            $"/api/applications/{Guid.NewGuid()}/status",
            JsonContent.Create(new { status = "applied" }));

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("application_not_found");
    }

    [Fact]
    public async Task DeleteApplication_RemovesIt()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid id = await CreateApplicationAsync(client);

        HttpResponseMessage response = await client.DeleteAsync($"/api/applications/{id}");

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        JsonElement state = await ReadJsonAsync(await client.GetAsync("/api/state"));
        state.GetProperty("applications").GetArrayLength().ShouldBe(0);
    }

    [Fact]
    public async Task DeleteApplication_Unknown_ReturnsNotFound()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.DeleteAsync($"/api/applications/{Guid.NewGuid()}");

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("application_not_found");
    }

    [Fact]
    public async Task SaveGeneratedResume_ReturnsApplicationWithResume()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid id = await CreateApplicationAsync(client);

        HttpResponseMessage response = await client.PutAsJsonAsync(
            $"/api/applications/{id}/generated-resume",
            new { resume = new GeneratedResume { Summary = "Tailored summary." } });

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonElement application = (await ReadJsonAsync(response)).GetProperty("application");
        application.GetProperty("generatedResume").GetProperty("summary").GetString()
            .ShouldBe("Tailored summary.");
    }

    [Fact]
    public async Task SaveGeneratedResume_UnknownApplication_ReturnsNotFound()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PutAsJsonAsync(
            $"/api/applications/{Guid.NewGuid()}/generated-resume",
            new { resume = new GeneratedResume { Summary = "Tailored summary." } });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("application_not_found");
    }

    [Fact]
    public async Task Clients_WithDifferentCookies_AreIsolated()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient firstClient = factory.CreateClient();
        using HttpClient secondClient = factory.CreateClient();

        await CreateApplicationAsync(firstClient);

        JsonElement firstState = await ReadJsonAsync(await firstClient.GetAsync("/api/state"));
        JsonElement secondState = await ReadJsonAsync(await secondClient.GetAsync("/api/state"));

        firstState.GetProperty("applications").GetArrayLength().ShouldBe(1);
        secondState.GetProperty("applications").GetArrayLength().ShouldBe(0);
    }

    [Fact]
    public async Task GetState_WhenPersistenceUnavailable_ReturnsDatabaseUnavailable()
    {
        await using JobriqWebFactory factory = new();
        factory.Repository.Unavailable = true;
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/api/state");

        response.StatusCode.ShouldBe(HttpStatusCode.ServiceUnavailable);
        JsonElement problem = await ReadJsonAsync(response);
        problem.GetProperty("code").GetString().ShouldBe("database_unavailable");
    }

    [Fact]
    public async Task UnknownApiPath_ReturnsNotFound()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/api/unknown");

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task NonApiPath_ReturnsSpaIndex()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/profile");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("jobriq");
    }

    private static async Task<Guid> CreateApplicationAsync(HttpClient client)
    {
        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/applications",
            new { company = "Acme", role = "Engineer", jobDescription = "Build things." });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        JsonElement application = (await ReadJsonAsync(response)).GetProperty("application");

        return application.GetProperty("id").GetGuid();
    }

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response)
    {
        string json = await response.Content.ReadAsStringAsync();
        using JsonDocument document = JsonDocument.Parse(json);

        return document.RootElement.Clone();
    }
}
