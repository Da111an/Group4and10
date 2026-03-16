namespace Server.Models;

public class Interaction
{
    public int InteractionId { get; set; }
    public int UserId { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string ActionValue { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }

    public User User { get; set; } = null!;
}
