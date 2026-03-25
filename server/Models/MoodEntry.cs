using System.ComponentModel.DataAnnotations;

namespace Server.Models;

public class MoodEntry
{
    [Key]
    public int EntryId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [Range(1, 10, ErrorMessage = "Mood rating must be between 1 and 10.")]
    public int MoodRating { get; set; }

    [Required]
    [MaxLength(100)]
    public string PrimaryEmotion { get; set; } = string.Empty;

    public DateTime EntryDate { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}