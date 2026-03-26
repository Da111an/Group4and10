using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    public class KeyResult
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string ObjectiveId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        public double StartingValue { get; set; } = 0;
        public double TargetValue { get; set; }
        public double CurrentValue { get; set; }
        
        [MaxLength(50)]
        public string Unit { get; set; } // e.g., "%", "days", "hours"

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ObjectiveId")]
        public Objective Objective { get; set; }

        // Navigation property for tracking progress over time
        public List<KeyResultHistory> HistoryLogs { get; set; } = new();
    }
}