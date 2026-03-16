namespace Server.Models;

public class Resource
{
    public int ResourceId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string TargetUrl { get; set; } = string.Empty;
    public string IconAsset { get; set; } = string.Empty;
}
