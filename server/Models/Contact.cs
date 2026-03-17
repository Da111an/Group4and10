using System.ComponentModel.DataAnnotations;

namespace Server.Models;

public class Contact
{
    public int ContactId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Phone]
    [MaxLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Relationship { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public User User { get; set; } = null!;
}
