using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    public class Objective
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public int UserAccountId { get; set; } // Changed to int to match UserAccount.Id

        [Required]
        [MaxLength(200)]
        public string Title { get; set; }
        
        [MaxLength(1000)]
        public string Description { get; set; }
        
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime TargetDate { get; set; }

        [ForeignKey("UserAccountId")]
        public UserAccount UserAccount { get; set; }

        // Navigation property
        public List<KeyResult> KeyResults { get; set; } = new();
    }
}