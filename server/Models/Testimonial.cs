using System.ComponentModel.DataAnnotations;

namespace Server.Models;

public class Testimonial
{
    public int TestimonialId { get; set; }

    [Required]
    [MaxLength(150)]
    public string AuthorName { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [MaxLength(500)]
    public string ProfilePic { get; set; } = string.Empty;

    public DateTime DatePosted { get; set; } = DateTime.UtcNow;

    public bool IsVerified { get; set; }
}
