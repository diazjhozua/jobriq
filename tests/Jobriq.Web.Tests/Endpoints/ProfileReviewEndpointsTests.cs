using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Jobriq.Web.Tests.Endpoints;

public sealed class ProfileReviewEndpointsTests
{
    [Fact]
    public async Task Review_ReturnsDeterministicSuggestionsFromFakeAi()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();
        Guid experienceId = Guid.NewGuid();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/review",
            CreateReviewRequest(experienceId));

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        ReviewResponse? review = await response.Content.ReadFromJsonAsync<ReviewResponse>();
        review.ShouldNotBeNull();
        review.Suggestions.Count.ShouldBe(3);

        ReviewSuggestionResponse summary = review.Suggestions.Single(item => item.Section == "summary");
        summary.ProposedText.ShouldBe("Deterministic reviewed summary.");
        summary.ItemId.ShouldBeNull();
        summary.BulletIndex.ShouldBeNull();

        ReviewSuggestionResponse experience = review.Suggestions.Single(item => item.Section == "experience");
        experience.ItemId.ShouldBe(experienceId);
        experience.BulletIndex.ShouldBe(0);
        experience.OriginalText.ShouldBe("Built a thing");
        experience.ProposedText.ShouldBe("Reviewed: Built a thing");
        experience.Category.ShouldBe("impact");

        ReviewSuggestionResponse skills = review.Suggestions.Single(item => item.Section == "skills");
        skills.ProposedText.ShouldBeNull();
        skills.Category.ShouldBe("clarity");

        review.Suggestions.ShouldAllBe(item => item.Id != Guid.Empty);
    }

    [Fact]
    public async Task Review_WithoutProfile_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/review",
            new { profile = (object?)null });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        string body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("invalid_request");
    }

    [Fact]
    public async Task Review_WithNullSection_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/review",
            new
            {
                profile = new
                {
                    personal = new { name = "Jane Doe" },
                    summaryType = "professional",
                    summary = string.Empty,
                    experience = (object?)null,
                    education = Array.Empty<object>(),
                    skills = Array.Empty<string>(),
                    projects = Array.Empty<object>()
                }
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        string body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("invalid_request");
    }

    [Fact]
    public async Task Review_WithNullCertifications_ReturnsInvalidRequest()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/review",
            new
            {
                profile = new
                {
                    personal = new { name = "Jane Doe" },
                    summaryType = "professional",
                    summary = string.Empty,
                    experience = Array.Empty<object>(),
                    education = Array.Empty<object>(),
                    certifications = (object?)null,
                    awards = Array.Empty<object>(),
                    skills = Array.Empty<string>(),
                    projects = Array.Empty<object>()
                }
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        string body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("invalid_request");
    }

    [Fact]
    public async Task Review_WithoutApiKey_ReturnsMissingKeyProblem()
    {
        await using MissingKeyWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/profile/review",
            CreateReviewRequest(Guid.NewGuid()));

        response.StatusCode.ShouldBe(HttpStatusCode.ServiceUnavailable);
        string body = await response.Content.ReadAsStringAsync();
        body.ShouldContain("missing_api_key");
    }

    [Fact]
    public async Task Review_DoesNotPersistTheProfile()
    {
        await using JobriqWebFactory factory = new();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage reviewResponse = await client.PostAsJsonAsync(
            "/api/profile/review",
            CreateReviewRequest(Guid.NewGuid()));
        reviewResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        using JsonDocument document = JsonDocument.Parse(
            await client.GetStringAsync("/api/state"));
        JsonElement profile = document.RootElement.GetProperty("profile");
        profile.GetProperty("summary").GetString().ShouldBeEmpty();
        profile.GetProperty("experience").GetArrayLength().ShouldBe(0);
    }

    private static object CreateReviewRequest(Guid experienceId) => new
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
            summary = string.Empty,
            experience = new[]
            {
                new
                {
                    id = experienceId,
                    company = "Acme",
                    title = "Engineer",
                    startDate = "2022",
                    endDate = "Present",
                    bullets = new[] { "Built a thing" }
                }
            },
            education = Array.Empty<object>(),
            certifications = Array.Empty<object>(),
            awards = Array.Empty<object>(),
            skills = new[] { "C#" },
            projects = Array.Empty<object>()
        }
    };

    private sealed class ReviewResponse
    {
        public List<ReviewSuggestionResponse> Suggestions { get; set; } = [];
    }

    private sealed class ReviewSuggestionResponse
    {
        public Guid Id { get; set; }

        public string? Section { get; set; }

        public Guid? ItemId { get; set; }

        public int? BulletIndex { get; set; }

        public string? Category { get; set; }

        public string? Title { get; set; }

        public string? OriginalText { get; set; }

        public string? ProposedText { get; set; }
    }

}
