using System.ComponentModel.DataAnnotations;

namespace Server.Models;

public class Resource
{
    public int ResourceId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [Url]
    [MaxLength(500)]
    public string TargetUrl { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string IconAsset { get; set; } = string.Empty;
}
