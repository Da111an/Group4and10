using System.Text;
using System.Text.Json;
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

    private static readonly JsonSerializerOptions GeminiJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

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

        var apiKey = ResolveGeminiApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("GEMINI_API_KEY is not configured for /api/chat.");
            if (_environment.IsDevelopment())
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    reply = "Chat setup error: GEMINI_API_KEY is missing on the server. Start `dotnet run` in the same terminal where you set it, or configure `dotnet user-secrets` for the server project."
                });
            }

            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                reply = "I'm having trouble connecting right now. If things feel heavy, reaching out to 988 or someone you trust could help."
            });
        }

        var model = ResolveGeminiModel();
        var payload = new
        {
            contents = new object[]
            {
                new
                {
                    role = "user",
                    parts = new object[]
                    {
                        new
                        {
                            text = message
                        }
                    }
                }
            },
            systemInstruction = new
            {
                parts = new object[]
                {
                    new
                    {
                        text = "You are a supportive listener for a mental health web app. Respond with warmth, empathy, and calm, human language. Start by briefly acknowledging or reflecting the user's feelings. Keep replies supportive and non-judgmental, usually 3 to 5 sentences. Do not give medical advice. Do not act as a therapist or crisis counselor. When appropriate, encourage the user to reach out to a trusted person or crisis resource. Sometimes include one gentle follow-up question."
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0.8,
                maxOutputTokens = 300
            }
        };

        var client = _httpClientFactory.CreateClient();

        using var httpContent = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json");

        using var response = await client.PostAsync(
            $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={Uri.EscapeDataString(apiKey)}",
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
            var rawResponse = await response.Content.ReadAsStringAsync(cancellationToken);
            var llmResponse = JsonSerializer.Deserialize<GeminiGenerateContentResponse>(rawResponse, GeminiJsonOptions);
            reply = llmResponse?.Candidates?
                .FirstOrDefault()?
                .Content?
                .TextContent?
                .Trim();

            if (string.IsNullOrWhiteSpace(reply))
            {
                _logger.LogError("Gemini returned HTTP 200 but no usable reply. Raw body: {Body}", rawResponse);
            }
        }

        if (string.IsNullOrWhiteSpace(reply))
        {
            _logger.LogError("Chat API returned no usable reply. Last error: {LastError}", lastError);
            if (!string.IsNullOrWhiteSpace(lastError))
            {
                var friendlyError = TryBuildFriendlyGeminiError(lastError);
                return StatusCode(StatusCodes.Status502BadGateway, new
                {
                    reply = friendlyError ?? $"Chat setup error: {lastError}"
                });
            }

            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                reply = "I'm having trouble responding right now. If you need immediate support, call or text 988, or contact someone you trust."
            });
        }

        return Ok(new { reply });
    }

    private string? ResolveGeminiApiKey() =>
        _configuration["GEMINI_API_KEY"] ??
        _configuration["Gemini:ApiKey"];

    private string ResolveGeminiModel() =>
        _configuration["GEMINI_MODEL"] ??
        _configuration["Gemini:Model"] ??
        "gemini-2.5-flash";

    private static string? TryBuildFriendlyGeminiError(string errorJson)
    {
        try
        {
            using var document = JsonDocument.Parse(errorJson);
            var root = document.RootElement;
            if (!root.TryGetProperty("error", out var error))
            {
                return null;
            }

            var code = error.TryGetProperty("code", out var codeElement) && codeElement.ValueKind == JsonValueKind.Number
                ? codeElement.GetInt32()
                : 0;

            var message = error.TryGetProperty("message", out var messageElement) && messageElement.ValueKind == JsonValueKind.String
                ? messageElement.GetString()
                : null;

            if (code == 404 && !string.IsNullOrWhiteSpace(message))
            {
                return $"Chat setup error: Gemini model not found. The configured model name is likely outdated or unsupported. Google currently documents `gemini-2.5-flash` and `gemini-2.0-flash` as valid model codes.";
            }

            if (code == 429)
            {
                return "Chat setup error: Gemini accepted the request, but your project has no available quota for this model right now. Try again later, switch models, or check your Gemini quota page.";
            }
        }
        catch
        {
            // Fall back to the raw error when the body is not valid JSON.
        }

        return null;
    }

    private static bool IsHighRisk(string message)
    {
        var normalized = message.ToLowerInvariant();
        return HighRiskPhrases.Any(normalized.Contains);
    }

    private sealed class GeminiGenerateContentResponse
    {
        public List<GeminiCandidate>? Candidates { get; set; }
    }

    private sealed class GeminiCandidate
    {
        public GeminiContent? Content { get; set; }
    }

    private sealed class GeminiContent
    {
        public List<GeminiPart>? Parts { get; set; }

        public string? TextContent => Parts is null
            ? null
            : string.Join("\n", Parts
                .Select(part => part.Text?.Trim())
                .Where(text => !string.IsNullOrWhiteSpace(text)));
    }

    private sealed class GeminiPart
    {
        public string? Text { get; set; }
    }
}

public sealed class ChatRequest
{
    public string Message { get; set; } = "";
}
