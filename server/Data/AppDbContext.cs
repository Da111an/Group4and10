using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<UserAccount> UserAccounts => Set<UserAccount>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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
    }
}
