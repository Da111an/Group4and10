using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private const string SessionAliasKey = "SafeHarbor.Alias";
    private const string SessionUserIdKey = "SafeHarbor.UserId";
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
    private readonly AppDbContext _dbContext;

    public ChatController(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<ChatController> logger,
        IHostEnvironment environment,
        AppDbContext dbContext)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
        _environment = environment;
        _dbContext = dbContext;
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
        var personalizedContext = await BuildUserContextAsync(cancellationToken);
        var systemInstruction = BuildSystemInstruction(personalizedContext);
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
                        text = systemInstruction
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

    private async Task<string> BuildUserContextAsync(CancellationToken cancellationToken)
    {
        var alias = HttpContext.Session.GetString(SessionAliasKey);
        var userId = HttpContext.Session.GetInt32(SessionUserIdKey);
        if (userId is null)
        {
            return string.IsNullOrWhiteSpace(alias)
                ? "User is browsing as a guest and has no saved account data."
                : $"User is browsing as guest alias '{alias}'.";
        }

        var account = await _dbContext.UserAccounts
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == userId.Value, cancellationToken);

        var recentCheckIns = await _dbContext.UserDailyCheckIns
            .AsNoTracking()
            .Where(x => x.UserAccountId == userId.Value)
            .OrderByDescending(x => x.DateKey)
            .Take(7)
            .ToListAsync(cancellationToken);

        var objectives = await _dbContext.Objectives
            .AsNoTracking()
            .Include(x => x.KeyResults)
            .Where(x => x.UserAccountId == userId.Value)
            .OrderByDescending(x => x.TargetDate)
            .Take(3)
            .ToListAsync(cancellationToken);

        var context = new StringBuilder();
        var displayName = !string.IsNullOrWhiteSpace(account?.FullName)
            ? account!.FullName
            : (string.IsNullOrWhiteSpace(alias) ? "User" : alias!);
        context.AppendLine($"Logged-in user: {displayName}.");

        if (recentCheckIns.Count == 0)
        {
            context.AppendLine("No check-ins have been logged yet.");
        }
        else
        {
            var averageMood = Math.Round(recentCheckIns.Average(x => x.Mood), 1);
            var averageSleep = Math.Round(recentCheckIns.Average(x => x.Sleep), 1);
            context.AppendLine($"Recent check-ins (last {recentCheckIns.Count}): avg mood {averageMood}/5, avg sleep {averageSleep}h.");

            var latest = recentCheckIns.First();
            var emotions = ExtractEmotions(latest.EmotionsJson);
            if (emotions.Count > 0)
            {
                context.AppendLine(
                    $"Latest check-in on {latest.DateKey}: mood {latest.Mood}/5, sleep {latest.Sleep:0.#}h, emotions [{string.Join(", ", emotions.Take(5))}].");
            }
            else
            {
                context.AppendLine(
                    $"Latest check-in on {latest.DateKey}: mood {latest.Mood}/5, sleep {latest.Sleep:0.#}h.");
            }
        }

        if (objectives.Count == 0)
        {
            context.AppendLine("No active personal objectives are stored.");
        }
        else
        {
            context.AppendLine("Top active objectives:");
            foreach (var objective in objectives)
            {
                var progress = BuildObjectiveProgressSummary(objective);
                context.AppendLine($"- {objective.Title}: {progress}");
            }
        }

        return context.ToString().Trim();
    }

    private static string BuildSystemInstruction(string personalizedContext)
    {
        var instruction = new StringBuilder();
        instruction.AppendLine("You are a supportive listener for the SafeHarbor mental wellness app.");
        instruction.AppendLine("Respond with warmth, empathy, and calm, human language.");
        instruction.AppendLine("Start by briefly acknowledging or reflecting the user's feelings.");
        instruction.AppendLine("Keep replies supportive and non-judgmental, usually 3 to 5 sentences.");
        instruction.AppendLine("Do not give medical advice. Do not act as a therapist or crisis counselor.");
        instruction.AppendLine("When appropriate, encourage the user to reach out to a trusted person or crisis resource.");
        instruction.AppendLine("You have app-specific user context below. Use it gently to personalize your reply, but do not mention technical details or expose private data.");
        instruction.AppendLine("User context:");
        instruction.AppendLine(personalizedContext);
        return instruction.ToString().Trim();
    }

    private static List<string> ExtractEmotions(string emotionsJson)
    {
        try
        {
            return JsonSerializer.Deserialize<string[]>(emotionsJson)?
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList() ?? [];
        }
        catch
        {
            return [];
        }
    }

    private static string BuildObjectiveProgressSummary(Objective objective)
    {
        if (objective.KeyResults is null || objective.KeyResults.Count == 0)
        {
            return "no key results yet";
        }

        var summaries = objective.KeyResults
            .Take(3)
            .Select(kr =>
            {
                var progress = CalculateProgressPercent(
                    kr.StartingValue,
                    kr.CurrentValue,
                    kr.TargetValue);
                var unit = string.IsNullOrWhiteSpace(kr.Unit) ? "" : $" {kr.Unit}";
                return $"{kr.Title}: {kr.CurrentValue:0.#}/{kr.TargetValue:0.#}{unit} ({progress:0}%)";
            });

        return string.Join("; ", summaries);
    }

    private static double CalculateProgressPercent(double start, double current, double target)
    {
        var range = target - start;
        if (Math.Abs(range) < 0.0001)
        {
            return 100;
        }

        var progress = ((current - start) / range) * 100d;
        return Math.Clamp(progress, 0d, 100d);
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
