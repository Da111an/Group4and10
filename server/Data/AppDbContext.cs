using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Session> Sessions { get; set; }
    public DbSet<MoodEntry> MoodEntries { get; set; }
    public DbSet<Interaction> Interactions { get; set; }
    public DbSet<Contact> Contacts { get; set; }
    public DbSet<Resource> Resources { get; set; }
    public DbSet<Testimonial> Testimonials { get; set; }
    public DbSet<UserAccount> UserAccounts { get; set; }
    public DbSet<UserDailyCheckIn> UserDailyCheckIns { get; set; }
    
    // OKR Tracking Tables
    public DbSet<Objective> Objectives { get; set; }
    public DbSet<KeyResult> KeyResults { get; set; }
    public DbSet<KeyResultHistory> KeyResultHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Original Model Configurations
        modelBuilder.Entity<User>().HasKey(u => u.UserId);

        modelBuilder.Entity<Session>()
            .HasKey(s => s.SessionId);
        modelBuilder.Entity<Session>()
            .HasOne(s => s.User)
            .WithMany(u => u.Sessions)
            .HasForeignKey(s => s.UserId);

        modelBuilder.Entity<MoodEntry>()
            .HasKey(m => m.EntryId);
        modelBuilder.Entity<MoodEntry>()
            .HasOne(m => m.User)
            .WithMany(u => u.MoodEntries)
            .HasForeignKey(m => m.UserId);

        modelBuilder.Entity<Interaction>()
            .HasKey(i => i.InteractionId);
        modelBuilder.Entity<Interaction>()
            .HasOne(i => i.User)
            .WithMany(u => u.Interactions)
            .HasForeignKey(i => i.UserId);

        modelBuilder.Entity<Contact>()
            .HasKey(c => c.ContactId);
        modelBuilder.Entity<Contact>()
            .HasOne(c => c.User)
            .WithMany(u => u.Contacts)
            .HasForeignKey(c => c.UserId);

        modelBuilder.Entity<Resource>().HasKey(r => r.ResourceId);
        modelBuilder.Entity<Testimonial>().HasKey(t => t.TestimonialId);

        modelBuilder.Entity<UserAccount>(entity =>
        {
            entity.HasIndex(x => x.NormalizedUsername).IsUnique();
            entity.HasIndex(x => x.NormalizedEmail)
                .IsUnique()
                .HasFilter("\"NormalizedEmail\" <> ''");
            entity.Property(x => x.FullName).HasMaxLength(120);
            entity.Property(x => x.Username).HasMaxLength(100);
            entity.Property(x => x.NormalizedUsername).HasMaxLength(100);
            entity.Property(x => x.Email).HasMaxLength(200);
            entity.Property(x => x.NormalizedEmail).HasMaxLength(200);
            entity.Property(x => x.PasswordHash).HasMaxLength(500);
        });

        modelBuilder.Entity<UserDailyCheckIn>(entity =>
        {
            entity.HasIndex(x => new { x.UserAccountId, x.DateKey }).IsUnique();
            entity.Property(x => x.DateKey).HasMaxLength(10);
            entity.Property(x => x.EmotionsJson).HasMaxLength(4000);
        });

        // OKR Relationship Configurations
        modelBuilder.Entity<Objective>()
            .HasOne(o => o.UserAccount)
            .WithMany()
            .HasForeignKey(o => o.UserAccountId);

        modelBuilder.Entity<KeyResult>()
            .HasOne(k => k.Objective)
            .WithMany(o => o.KeyResults)
            .HasForeignKey(k => k.ObjectiveId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<KeyResultHistory>()
            .HasOne(h => h.KeyResult)
            .WithMany(k => k.HistoryLogs)
            .HasForeignKey(h => h.KeyResultId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}