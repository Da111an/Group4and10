using Microsoft.AspNetCore.Mvc;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MoodController : ControllerBase
{
    [HttpPost]
    public IActionResult Save([FromBody] MoodEntryRequest request)
    {
        if (request == null) return BadRequest();
        return Ok(new { success = true });
    }

    [HttpGet("today")]
    public IActionResult GetToday()
    {
        return Ok(null as object);
    }
}

public class MoodEntryRequest
{
    public string Date { get; set; } = "";
    public int Mood { get; set; }
    public int Sleep { get; set; }
    public string[] Emotions { get; set; } = [];
}
