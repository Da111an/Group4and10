using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OkrController : ControllerBase
{
    private readonly AppDbContext _context;

    public OkrController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/Okr/user/{userId}
    // Used to fetch individual OKR progress for the dashboard widget
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserOkrs(int userId)
    {
        var okrs = await _context.Objectives
            .Include(o => o.KeyResults)
                .ThenInclude(kr => kr.HistoryLogs)
            .Where(o => o.UserAccountId == userId)
            .ToListAsync();
        return Ok(okrs);
    }

    // POST: api/Okr/keyresult/{id}/progress
    // Automatically updates progress and creates a history log entry for tracking over time
    [HttpPost("keyresult/{id}/progress")]
    public async Task<IActionResult> UpdateProgress(string id, [FromBody] double newValue)
    {
        var keyResult = await _context.KeyResults.FindAsync(id);
        if (keyResult == null) return NotFound();

        // 1. Update current progress value
        keyResult.CurrentValue = newValue;
        keyResult.UpdatedAt = DateTime.UtcNow;

        // 2. Automatically create a timestamped history log for the database
        var historyEntry = new KeyResultHistory
        {
            KeyResultId = id,
            RecordedValue = newValue,
            RecordedAt = DateTime.UtcNow
        };

        _context.KeyResultHistories.Add(historyEntry);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Progress tracked and history log created.", keyResult });
    }

    // GET: api/Okr/admin/stats
    // Aggregate Business OKR: Track completion percentage across the entire user base
    [HttpGet("admin/stats")]
    public async Task<IActionResult> GetGlobalStats()
    {
        // 1. Get total count of registered users
        var totalUsers = await _context.UserAccounts.CountAsync();
        if (totalUsers == 0) return Ok(new { completionRate = "0%" });

        // 2. Count users who have met the habit formation goal (7+ check-ins)
        var successfulUsers = await _context.UserAccounts
            .Where(u => _context.UserDailyCheckIns.Count(c => c.UserAccountId == u.Id) >= 7)
            .CountAsync();

        // 3. Calculate global completion percentage
        double percentage = (double)successfulUsers / totalUsers * 100;

        return Ok(new {
            TotalUsers = totalUsers,
            UsersMeetingGoal = successfulUsers,
            GlobalCompletionRate = $"{Math.Round(percentage, 1)}%",
            TargetGoal = "75% Completion Rate"
        });
    }
}