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

    // GET: api/Okr/user/1
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
    // This is the "Automatic Tracking" part
    [HttpPost("keyresult/{id}/progress")]
    public async Task<IActionResult> UpdateProgress(string id, [FromBody] double newValue)
    {
        var keyResult = await _context.KeyResults.FindAsync(id);
        if (keyResult == null) return NotFound();

        // 1. Update the current value
        keyResult.CurrentValue = newValue;
        keyResult.UpdatedAt = DateTime.UtcNow;

        // 2. AUTOMATICALLY create a history log entry
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
}