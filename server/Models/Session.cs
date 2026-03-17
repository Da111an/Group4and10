using System.ComponentModel.DataAnnotations;

namespace Server.Models;

public class Session
{
    public int SessionId { get; set; }

    [Required]
    public int UserId { get; set; }

    public DateTime LoginTime { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(100)]
    public string DeviceType { get; set; } = string.Empty;

    [Range(0, int.MaxValue)]
    public int InteractionCount { get; set; }

    public User User { get; set; } = null!;
}
