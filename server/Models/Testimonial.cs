namespace Server.Models;

public class Testimonial
{
    public int TestimonialId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string ProfilePic { get; set; } = string.Empty;
    public DateTime DatePosted { get; set; }
    public bool IsVerified { get; set; }
}
