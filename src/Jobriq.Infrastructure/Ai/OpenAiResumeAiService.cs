using System.ClientModel;
using System.Text.Json;
using Jobriq.Application.Abstractions;
using Jobriq.Domain.Reviews;
using Jobriq.Domain.Resumes;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OpenAI;
using OpenAI.Chat;

namespace Jobriq.Infrastructure.Ai;

internal sealed class OpenAiResumeAiService(
    IConfiguration configuration,
    ILogger<OpenAiResumeAiService> logger) : IResumeAiService
{
    private const string DefaultModel = "gpt-4o";

    private ChatClient? chatClient;

    public void EnsureAvailable()
    {
        if (string.IsNullOrWhiteSpace(ResolveApiKey()))
        {
            throw new MissingApiKeyException();
        }
    }

    public async Task<CoverLetterDraft> GenerateCoverLetterAsync(
        ResumeProfile profile,
        string company,
        string role,
        string jobDescription,
        CancellationToken cancellationToken)
    {
        string content = await CompleteAsync(
            Prompts.GenerateCoverLetter(profile, company, role, jobDescription),
            json: true,
            cancellationToken,
            Prompts.CoverLetterSystem);

        return Parse<CoverLetterDraft>(content) ?? new CoverLetterDraft();
    }

    public async Task<IReadOnlyList<ReviewSuggestion>> ReviewProfileAsync(
        ResumeProfile profile,
        CancellationToken cancellationToken)
    {
        string content = await CompleteAsync(Prompts.ReviewProfile(profile), json: true, cancellationToken);
        ReviewResponse? response = Parse<ReviewResponse>(content);

        return ReviewSuggestionMapper.Map(response?.Suggestions);
    }

    public async Task<IReadOnlyList<EnhancedBullet>> EnhanceExperienceBulletsAsync(
        WorkExperience experience,
        CancellationToken cancellationToken)
    {
        string content = await CompleteAsync(Prompts.EnhanceExperience(experience), json: true, cancellationToken);
        EnhanceResponse? response = Parse<EnhanceResponse>(content);

        return response?.Bullets ?? [];
    }

    public async Task<IReadOnlyList<EnhancedBullet>> EnhanceProjectBulletsAsync(
        Project project,
        CancellationToken cancellationToken)
    {
        string content = await CompleteAsync(Prompts.EnhanceProject(project), json: true, cancellationToken);
        EnhanceResponse? response = Parse<EnhanceResponse>(content);

        return response?.Bullets ?? [];
    }

    public async Task<string> GenerateSummaryAsync(
        IReadOnlyList<WorkExperience> experience,
        SummaryType summaryType,
        CancellationToken cancellationToken)
    {
        string content = await CompleteAsync(Prompts.GenerateSummary(experience, summaryType), json: false, cancellationToken);

        return content.Trim();
    }

    public async Task<KeywordMatch> ExtractKeywordsAsync(
        string jobDescription,
        ResumeProfile profile,
        CancellationToken cancellationToken)
    {
        string content = await CompleteAsync(Prompts.ExtractKeywords(jobDescription, profile), json: true, cancellationToken);
        KeywordResponse? response = Parse<KeywordResponse>(content);

        return new KeywordMatch
        {
            Matched = response?.Matched ?? [],
            Missing = response?.Missing ?? []
        };
    }

    private async Task<string> CompleteAsync(
        string userPrompt,
        bool json,
        CancellationToken cancellationToken,
        string? systemPrompt = null)
    {
        try
        {
            ChatClient client = GetChatClient();
            ChatCompletionOptions options = new();
            if (json)
            {
                options.ResponseFormat = ChatResponseFormat.CreateJsonObjectFormat();
            }

            ChatCompletion completion = await client.CompleteChatAsync(
                [
                    new SystemChatMessage(systemPrompt ?? Prompts.System),
                    new UserChatMessage(userPrompt)
                ],
                options,
                cancellationToken);

            return string.Concat(completion.Content.Select(part => part.Text));
        }
        catch (ClientResultException exception) when (exception.Status is 401 or 403)
        {
            logger.LogError(exception, "OpenAI rejected the configured API key.");
            throw new AiServiceException(
                "openai_unauthorized",
                "OpenAI rejected the configured API key. Check OpenAI:ApiKey and OpenAI:BaseUrl.",
                502);
        }
        catch (ClientResultException exception) when (exception.Status == 429)
        {
            logger.LogWarning(exception, "OpenAI rate limit reached.");
            throw new AiServiceException(
                "openai_rate_limited",
                "OpenAI rate limit reached. Wait a moment and try again.",
                429);
        }
        catch (ClientResultException exception)
        {
            logger.LogError(exception, "OpenAI request failed with status {Status}.", exception.Status);
            throw new AiServiceException(
                "openai_failed",
                "The OpenAI request failed. Try again.",
                502);
        }
        catch (HttpRequestException exception)
        {
            logger.LogError(exception, "OpenAI request could not be completed.");
            throw new AiServiceException(
                "openai_failed",
                "The OpenAI request failed. Check the network connection and try again.",
                502);
        }
    }

    private ChatClient GetChatClient()
    {
        if (chatClient is not null)
        {
            return chatClient;
        }

        EnsureAvailable();

        OpenAIClientOptions options = new();
        string? endpoint = configuration["OpenAI:BaseUrl"]
            ?? configuration["OpenAI:Endpoint"]
            ?? configuration["OPENAI_BASE_URL"];
        if (!string.IsNullOrWhiteSpace(endpoint))
        {
            options.Endpoint = new Uri(endpoint);
        }

        string model = configuration["OpenAI:Model"]
            ?? configuration["OPENAI_MODEL"]
            ?? DefaultModel;

        OpenAIClient client = new(new ApiKeyCredential(ResolveApiKey()!), options);
        chatClient = client.GetChatClient(model);

        return chatClient;
    }

    private string? ResolveApiKey()
    {
        string? apiKey = configuration["OpenAI:ApiKey"];
        return string.IsNullOrWhiteSpace(apiKey) ? configuration["OPENAI_API_KEY"] : apiKey;
    }

    private T? Parse<T>(string content)
    {
        try
        {
            return JsonResponseParser.Parse<T>(content);
        }
        catch (JsonException exception)
        {
            logger.LogWarning(exception, "OpenAI response could not be parsed as JSON: {Content}", content);
            throw new AiServiceException(
                "openai_invalid_response",
                "OpenAI returned a response that could not be read. Try again.",
                502);
        }
    }

    private sealed class EnhanceResponse
    {
        public List<EnhancedBullet>? Bullets { get; set; }
    }

    private sealed class KeywordResponse
    {
        public List<string>? Matched { get; set; }

        public List<string>? Missing { get; set; }
    }

    private sealed class ReviewResponse
    {
        public List<ReviewSuggestionDto>? Suggestions { get; set; }
    }
}
