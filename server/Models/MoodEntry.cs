namespace Server.Models;

public class MoodEntry
{
    public int EntryId { get; set; }
    public int UserId { get; set; }
    public int MoodRating { get; set; }
    public string PrimaryEmotion { get; set; } = string.Empty;
    public DateTime EntryDate { get; set; }

    public User User { get; set; } = null!;
}
