using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
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
            contents = BuildGeminiContents(request, message),
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
                temperature = 0.5,
                maxOutputTokens = 500
            }
        };

        var client = _httpClientFactory.CreateClient();
        var modelsToTry = new[] { model, "gemini-2.0-flash" }
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        string? reply = null;
        string? lastError = null;
        foreach (var candidateModel in modelsToTry)
        {
            for (var attempt = 1; attempt <= 2; attempt++)
            {
                using var httpContent = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json");

                using var response = await client.PostAsync(
                    $"https://generativelanguage.googleapis.com/v1beta/models/{candidateModel}:generateContent?key={Uri.EscapeDataString(apiKey)}",
                    httpContent,
                    cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    lastError = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogWarning(
                        "Gemini API call failed for model {Model} attempt {Attempt} with status {StatusCode}: {Body}",
                        candidateModel,
                        attempt,
                        response.StatusCode,
                        lastError);

                    if (attempt == 1 && IsRetriableGeminiError((int)response.StatusCode, lastError))
                    {
                        await Task.Delay(500, cancellationToken);
                        continue;
                    }

                    break;
                }

                var rawResponse = await response.Content.ReadAsStringAsync(cancellationToken);
                var llmResponse = JsonSerializer.Deserialize<GeminiGenerateContentResponse>(rawResponse, GeminiJsonOptions);
                reply = llmResponse?.Candidates?
                    .FirstOrDefault()?
                    .Content?
                    .TextContent?
                    .Trim();

                if (string.IsNullOrWhiteSpace(reply))
                {
                    lastError = "Gemini returned no usable text content.";
                    _logger.LogWarning("Gemini returned HTTP 200 but no usable reply for model {Model}.", candidateModel);
                }
                else if (!LooksCompleteReply(reply))
                {
                    _logger.LogWarning("Gemini returned incomplete-looking reply for model {Model}: {Reply}", candidateModel, reply);
                    lastError = "Gemini returned an incomplete response.";
                    reply = null;
                }

                break;
            }

            if (!string.IsNullOrWhiteSpace(reply))
            {
                break;
            }
        }

        if (string.IsNullOrWhiteSpace(reply))
        {
            _logger.LogError("Chat API returned no usable reply. Last error: {LastError}", lastError);
            if (!string.IsNullOrWhiteSpace(lastError))
            {
                var friendlyError = TryBuildFriendlyGeminiError(lastError);
                if (!string.IsNullOrWhiteSpace(friendlyError))
                {
                    var fallbackReply = BuildServiceFallbackReply(message, request?.History);
                    return Ok(new
                    {
                        reply = fallbackReply
                    });
                }
            }

            return Ok(new
            {
                reply = BuildServiceFallbackReply(message, request?.History)
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
        instruction.AppendLine("You are SafeHarbor, a supportive assistant inside a suicide-prevention and mental wellness app.");
        instruction.AppendLine("Respond with warmth, calm, and non-judgmental language.");
        instruction.AppendLine("Tailor your response to the user's app context and recent check-in patterns when relevant.");
        instruction.AppendLine("Start by briefly acknowledging the user's feeling.");
        instruction.AppendLine("Then provide practical, gentle support and one small next step they can take right now.");
        instruction.AppendLine("When risk language appears, encourage immediate crisis support (call/text 988 in the US, 911 for immediate danger).");
        instruction.AppendLine("Do not provide medical diagnosis or treatment advice.");
        instruction.AppendLine("Write exactly 3 to 5 complete sentences.");
        instruction.AppendLine("Every sentence must be grammatically complete and end with punctuation.");
        instruction.AppendLine("Do not return fragments, sentence stubs, lists, markdown, or JSON.");
        instruction.AppendLine("You have app-specific user context below. Use it gently to personalize your reply, but do not mention technical details or expose private data.");
        instruction.AppendLine("User context:");
        instruction.AppendLine(personalizedContext);
        return instruction.ToString().Trim();
    }

    private static bool LooksCompleteReply(string reply)
    {
        var text = reply.Trim();
        if (text.Length < 20)
        {
            return false;
        }

        if (!(text.EndsWith(".") || text.EndsWith("!") || text.EndsWith("?")))
        {
            return false;
        }

        var sentenceEndCount = text.Count(c => c is '.' or '!' or '?');
        return sentenceEndCount >= 2;
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

            if (code == 503)
            {
                return "The chat model is temporarily busy right now. Please try again in a few moments.";
            }
        }
        catch
        {
            // Fall back to the raw error when the body is not valid JSON.
        }

        return null;
    }

    private static bool IsRetriableGeminiError(int statusCode, string? errorJson)
    {
        if (statusCode == 503)
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(errorJson))
        {
            return false;
        }

        try
        {
            using var document = JsonDocument.Parse(errorJson);
            if (!document.RootElement.TryGetProperty("error", out var error))
            {
                return false;
            }

            var code = error.TryGetProperty("code", out var codeElement) && codeElement.ValueKind == JsonValueKind.Number
                ? codeElement.GetInt32()
                : 0;
            var status = error.TryGetProperty("status", out var statusElement) && statusElement.ValueKind == JsonValueKind.String
                ? statusElement.GetString()
                : null;

            return code == 503 || string.Equals(status, "UNAVAILABLE", StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    private static string BuildServiceFallbackReply(string userMessage, IReadOnlyList<ChatHistoryItem>? history)
    {
        var normalized = userMessage.Trim().ToLowerInvariant();
        var hash = BuildStableHash($"{normalized}|{history?.Count ?? 0}");
        var reflection = BuildReflection(userMessage);
        var priorAssistant = history?
            .LastOrDefault(x => string.Equals(x.Role, "assistant", StringComparison.OrdinalIgnoreCase))
            ?.Text;

        var asksForResources = ContainsWholeWord(normalized, "resource")
            || ContainsWholeWord(normalized, "resources")
            || ContainsWholeWord(normalized, "support")
            || normalized.Contains("where can i")
            || normalized.Contains("what can i do")
            || normalized.Contains("what should i do")
            || normalized.Contains("i need help");

        var isGratitude = normalized.Contains("thank you")
            || normalized.Contains("thanks")
            || normalized.Contains("that helped")
            || normalized.Contains("it helped");

        var isCasualQuestion = normalized.Contains("favorite")
            || normalized.Contains("food")
            || normalized.Contains("movie")
            || normalized.Contains("music");

        if (asksForResources)
        {
            var templates = new[]
            {
                $"{reflection} A solid first step is to call or text 988 and let them know what feels hardest right now. You can also open the SafeHarbor resources tab and pick one option you can contact today. If you are in immediate danger, call 911 now.",
                $"{reflection} If you want immediate support, 988 is available by call or text right now. In SafeHarbor, you can review crisis and local support resources and choose one that feels doable for this moment. If you are in immediate danger, call 911 now.",
                $"{reflection} One practical next move is to reach out to 988 for live support while you are feeling this way. After that, use the SafeHarbor resources screen to choose one service and make contact today. If you are in immediate danger, call 911 now."
            };
            return SelectNonRepeatingTemplate(templates, hash, priorAssistant);
        }

        if (isGratitude)
        {
            var templates = new[]
            {
                "I am really glad to hear this helped, and I appreciate you telling me. You did something strong by reaching out when things were heavy. If difficult feelings come back, we can take the next step together.",
                "Thank you for sharing that with me. I am glad this conversation gave you some relief today. If things start feeling heavy again, we can look at one small next step right away.",
                "I am glad you feel a little better, and you deserve that support. You handled a hard moment with courage by speaking up. If you need support again, I am here and we can walk through it together."
            };
            return SelectNonRepeatingTemplate(templates, hash, priorAssistant);
        }

        if (isCasualQuestion)
        {
            var templates = new[]
            {
                $"{reflection} I do not have personal favorites, but I can still help with what comforts people when stress is high. If you want, I can suggest a few simple food or routine ideas that can help you feel grounded tonight.",
                $"{reflection} I do not have personal likes or dislikes, but we can still talk about what might help you feel better right now. If you want, I can share calming food and self-care options that are easy to try.",
                $"{reflection} I do not have personal favorites, but I can help you pick something comforting that fits how you are feeling. If you want, tell me what sounds manageable and I will suggest a few low-effort options."
            };
            return SelectNonRepeatingTemplate(templates, hash, priorAssistant);
        }

        var generalTemplates = new[]
        {
            $"{reflection} You do not have to carry this by yourself, and it makes sense to want help. One small step right now is to text 988 or message someone you trust and tell them you need support. If you are in immediate danger, call 911 now.",
            $"{reflection} I am glad you said this out loud because reaching out is an important step. Try one simple action now, such as texting 988 or asking a trusted person to stay with you while you calm down. If you are in immediate danger, call 911 now.",
            $"{reflection} It is okay to ask for support when things feel heavy. A useful next step is to contact 988, or send a short message to someone safe saying that you need help today. If you are in immediate danger, call 911 now."
        };
        return SelectNonRepeatingTemplate(generalTemplates, hash, priorAssistant);
    }

    private static object[] BuildGeminiContents(ChatRequest? request, string latestMessage)
    {
        var contents = new List<object>();
        var history = request?.History?
            .Where(item => item is not null && !string.IsNullOrWhiteSpace(item.Text))
            .TakeLast(8)
            .ToList();

        if (history is not null)
        {
            foreach (var item in history)
            {
                var role = string.Equals(item.Role, "assistant", StringComparison.OrdinalIgnoreCase)
                    ? "model"
                    : "user";

                contents.Add(new
                {
                    role,
                    parts = new object[]
                    {
                        new
                        {
                            text = item.Text.Trim()
                        }
                    }
                });
            }
        }

        contents.Add(new
        {
            role = "user",
            parts = new object[]
            {
                new
                {
                    text = latestMessage
                }
            }
        });

        return contents.ToArray();
    }

    private static int BuildStableHash(string text)
    {
        unchecked
        {
            var hash = 17;
            foreach (var c in text)
            {
                hash = (hash * 31) + c;
            }

            return Math.Abs(hash);
        }
    }

    private static string BuildReflection(string userMessage)
    {
        var text = userMessage.Trim();
        if (text.Length == 0)
        {
            return "I hear you.";
        }

        var shortText = text.Length > 90 ? $"{text[..90].Trim()}..." : text;
        var options = new[]
        {
            $"I hear you saying \"{shortText},\" and I am really glad you reached out.",
            $"Thank you for sharing \"{shortText}.\" You do not have to handle this alone.",
            $"I appreciate you telling me \"{shortText},\" and I am here with you."
        };
        var index = BuildStableHash(shortText) % options.Length;
        return options[index];
    }

    private static string SelectNonRepeatingTemplate(string[] options, int seed, string? previousAssistantMessage)
    {
        if (options.Length == 0)
        {
            return "I am here with you.";
        }

        var startIndex = seed % options.Length;
        if (string.IsNullOrWhiteSpace(previousAssistantMessage))
        {
            return options[startIndex];
        }

        for (var offset = 0; offset < options.Length; offset++)
        {
            var candidate = options[(startIndex + offset) % options.Length];
            if (!HasSameOpening(candidate, previousAssistantMessage))
            {
                return candidate;
            }
        }

        return options[startIndex];
    }

    private static bool HasSameOpening(string a, string b)
    {
        var startA = a.Trim().ToLowerInvariant();
        var startB = b.Trim().ToLowerInvariant();
        if (startA.Length == 0 || startB.Length == 0)
        {
            return false;
        }

        var prefixA = startA[..Math.Min(40, startA.Length)];
        var prefixB = startB[..Math.Min(40, startB.Length)];
        return prefixA == prefixB;
    }

    private static bool ContainsWholeWord(string text, string word) =>
        Regex.IsMatch(text, $@"\b{Regex.Escape(word)}\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

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
    public List<ChatHistoryItem> History { get; set; } = [];
}

public sealed class ChatHistoryItem
{
    public string Role { get; set; } = "user";
    public string Text { get; set; } = "";
}
