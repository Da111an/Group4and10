namespace Server.Models;

public class Session
{
    public int SessionId { get; set; }
    public int UserId { get; set; }
    public DateTime LoginTime { get; set; }
    public string DeviceType { get; set; } = string.Empty;
    public int InteractionCount { get; set; }

    public User User { get; set; } = null!;
}
