using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    // This model allows you to track progress over time for your charts
    public class KeyResultHistory
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string KeyResultId { get; set; }

        public double RecordedValue { get; set; }
        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("KeyResultId")]
        public KeyResult KeyResult { get; set; }
    }
}