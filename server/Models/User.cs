namespace Server.Models;

public class User
{
    public int UserId { get; set; }
    public string PasscodeHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsStudent { get; set; }
    public bool NotificationPref { get; set; }
    public string Email { get; set; } = string.Empty;

    public ICollection<Session> Sessions { get; set; } = [];
    public ICollection<MoodEntry> MoodEntries { get; set; } = [];
    public ICollection<Interaction> Interactions { get; set; } = [];
    public ICollection<Contact> Contacts { get; set; } = [];
}
