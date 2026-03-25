using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

namespace Server.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private const string CrisisResponse =
        "I'm really sorry you're feeling this way. You don't have to go through this alone. You can call or text 988 right now to talk to a trained counselor, or chat via 988lifeline.org. If you're in immediate danger, please call 911.";

    private static readonly string[] HighRiskPhrases =
    [
        "i want to die",
        "kill myself",
        "suicide",
        "i can't go on",
        "i cant go on",
        "i have a plan"
    ];

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ChatController> _logger;
    private readonly IHostEnvironment _environment;

    public ChatController(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<ChatController> logger,
        IHostEnvironment environment)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
        _environment = environment;
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] ChatRequest? request, CancellationToken cancellationToken)
    {
        var message = request?.Message?.Trim();
        if (string.IsNullOrWhiteSpace(message))
        {
            return BadRequest(new { reply = "Please send a message so I can respond." });
        }

        if (IsHighRisk(message))
        {
            return Ok(new { reply = CrisisResponse });
        }

        var apiKey = _configuration["OPENROUTER_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("OPENROUTER_API_KEY is not configured for /api/chat.");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                reply = "I'm having trouble connecting right now. If things feel heavy, reaching out to 988 or someone you trust could help."
            });
        }

        var model = _configuration["OPENROUTER_MODEL"] ?? "openai/gpt-4o-mini";
        var payload = new
        {
            model,
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = "You are a supportive listener for a mental health web app. Respond with warmth, empathy, and calm, human language. Start by briefly acknowledging or reflecting the user's feelings. Keep replies supportive and non-judgmental, usually 3 to 5 sentences. Do not give medical advice. Do not act as a therapist or crisis counselor. When appropriate, encourage the user to reach out to a trusted person or crisis resource. Sometimes include one gentle follow-up question."
                },
                new
                {
                    role = "user",
                    content = message
                }
            },
            temperature = 0.8
        };

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
        client.DefaultRequestHeaders.TryAddWithoutValidation("HTTP-Referer", "http://localhost:5027");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Title", "SafeHarbor");

        using var httpContent = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json");

        using var response = await client.PostAsync(
            "https://openrouter.ai/api/v1/chat/completions",
            httpContent,
            cancellationToken);

        string? reply = null;
        string? lastError = null;

        if (!response.IsSuccessStatusCode)
        {
            lastError = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Gemini API call failed for model {Model} with status {StatusCode}: {Body}", model, response.StatusCode, lastError);
        }
        else
        {
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var llmResponse = await JsonSerializer.DeserializeAsync<OpenRouterChatResponse>(stream, cancellationToken: cancellationToken);
            reply = llmResponse?.Choices?
                .FirstOrDefault()?
                .Message?
                .Content?
                .Trim();
        }

        if (string.IsNullOrWhiteSpace(reply))
        {
            _logger.LogError("Chat API returned no usable reply. Last error: {LastError}", lastError);
            if (!string.IsNullOrWhiteSpace(lastError))
            {
                return StatusCode(StatusCodes.Status502BadGateway, new
                {
                    reply = $"Chat setup error: {lastError}"
                });
            }

            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                reply = "I'm having trouble responding right now. If you need immediate support, call or text 988, or contact someone you trust."
            });
        }

        return Ok(new { reply });
    }

    private static bool IsHighRisk(string message)
    {
        var normalized = message.ToLowerInvariant();
        return HighRiskPhrases.Any(normalized.Contains);
    }

    private sealed class OpenRouterChatResponse
    {
        public List<OpenRouterChoice>? Choices { get; set; }
    }

    private sealed class OpenRouterChoice
    {
        public OpenRouterMessage? Message { get; set; }
    }

    private sealed class OpenRouterMessage
    {
        [JsonPropertyName("content")]
        public string? Text { get; set; }

        [JsonIgnore]
        public string? Content => Text;
    }
}

public sealed class ChatRequest
{
    public string Message { get; set; } = "";
}
