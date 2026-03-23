using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Server.Data;
using Server.Models;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MoodController : ControllerBase
{
    private const string SessionUserIdKey = "SafeHarbor.UserId";
    private readonly AppDbContext _dbContext;

    public MoodController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPost]
    public async Task<IActionResult> Save([FromBody] MoodEntryRequest request)
    {
        if (request is null)
        {
            return BadRequest(new { message = "Missing request body." });
        }

        var userAccountId = HttpContext.Session.GetInt32(SessionUserIdKey);
        if (userAccountId is null)
        {
            return Unauthorized(new { message = "You must be signed in to save a check-in." });
        }

        var dateKey = string.IsNullOrWhiteSpace(request.Date)
            ? DateTime.UtcNow.ToString("yyyy-MM-dd")
            : request.Date.Trim();

        if (dateKey.Length != 10)
        {
            return BadRequest(new { message = "Date must use yyyy-MM-dd format." });
        }

        if (request.Mood < 1 || request.Mood > 5)
        {
            return BadRequest(new { message = "Mood must be between 1 and 5." });
        }

        if (request.Sleep < 0 || request.Sleep > 24)
        {
            return BadRequest(new { message = "Sleep must be between 0 and 24 hours." });
        }

        var existing = await _dbContext.UserDailyCheckIns
            .SingleOrDefaultAsync(x => x.UserAccountId == userAccountId.Value && x.DateKey == dateKey);

        if (existing is null)
        {
            existing = new UserDailyCheckIn
            {
                UserAccountId = userAccountId.Value,
                DateKey = dateKey
            };
            _dbContext.UserDailyCheckIns.Add(existing);
        }

        existing.Mood = request.Mood;
        existing.Sleep = request.Sleep;
        existing.EmotionsJson = JsonSerializer.Serialize(request.Emotions ?? []);
        existing.UpdatedUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            id = existing.Id.ToString(),
            date = existing.DateKey,
            mood = existing.Mood,
            sleep = existing.Sleep,
            emotions = request.Emotions ?? []
        });
    }

    [HttpGet("today")]
    public async Task<IActionResult> GetToday()
    {
        var userAccountId = HttpContext.Session.GetInt32(SessionUserIdKey);
        if (userAccountId is null)
        {
            return Ok(null as object);
        }

        var todayKey = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var entry = await _dbContext.UserDailyCheckIns
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.UserAccountId == userAccountId.Value && x.DateKey == todayKey);

        if (entry is null)
        {
            return Ok(null as object);
        }

        string[] emotions;
        try
        {
            emotions = JsonSerializer.Deserialize<string[]>(entry.EmotionsJson) ?? [];
        }
        catch
        {
            emotions = [];
        }

        return Ok(new
        {
            id = entry.Id.ToString(),
            date = entry.DateKey,
            mood = entry.Mood,
            sleep = entry.Sleep,
            emotions
        });
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var userAccountId = HttpContext.Session.GetInt32(SessionUserIdKey);
        if (userAccountId is null)
        {
            return Ok(Array.Empty<object>());
        }

        var entries = await _dbContext.UserDailyCheckIns
            .AsNoTracking()
            .Where(x => x.UserAccountId == userAccountId.Value)
            .OrderByDescending(x => x.DateKey)
            .ToListAsync();

        var result = entries.Select(entry =>
        {
            string[] emotions;
            try
            {
                emotions = JsonSerializer.Deserialize<string[]>(entry.EmotionsJson) ?? [];
            }
            catch
            {
                emotions = [];
            }

            return new
            {
                id = entry.Id.ToString(),
                date = entry.DateKey,
                mood = entry.Mood,
                sleep = entry.Sleep,
                emotions
            };
        });

        return Ok(result);
    }

    [HttpDelete("today")]
    public async Task<IActionResult> DeleteToday()
    {
        var userAccountId = HttpContext.Session.GetInt32(SessionUserIdKey);
        if (userAccountId is null)
        {
            return Unauthorized(new { message = "You must be signed in to delete today's check-in." });
        }

        var todayKey = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var entry = await _dbContext.UserDailyCheckIns
            .SingleOrDefaultAsync(x => x.UserAccountId == userAccountId.Value && x.DateKey == todayKey);

        if (entry is null)
        {
            return Ok(new { success = true, deleted = false });
        }

        _dbContext.UserDailyCheckIns.Remove(entry);
        await _dbContext.SaveChangesAsync();

        return Ok(new { success = true, deleted = true });
    }
}

public class MoodEntryRequest
{
    public string Date { get; set; } = "";
    public int Mood { get; set; }
    public int Sleep { get; set; }
    public string[] Emotions { get; set; } = [];
}
