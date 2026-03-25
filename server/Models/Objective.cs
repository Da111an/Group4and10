using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Server.Models // Adjust namespace if your project uses a different one
{
    public class Objective
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string Title { get; set; }
        public string Description { get; set; }
        
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime TargetDate { get; set; }

        // Navigation property
        public List<KeyResult> KeyResults { get; set; } = new();
    }
}