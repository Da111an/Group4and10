using System.ComponentModel.DataAnnotations;

namespace Server.Models;

public class UserDailyCheckIn
{
    public int Id { get; set; }

    [Required]
    public int UserAccountId { get; set; }

    [Required]
    [MaxLength(10)]
    public string DateKey { get; set; } = string.Empty;

    [Range(1, 5)]
    public int Mood { get; set; }

    [Range(0, 24)]
    public double Sleep { get; set; }

    [MaxLength(4000)]
    public string EmotionsJson { get; set; } = "[]";

    public DateTime UpdatedUtc { get; set; } = DateTime.UtcNow;
}
