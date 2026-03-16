namespace Server.Models;

public class Contact
{
    public int ContactId { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    public User User { get; set; } = null!;
}
