using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=safeharbor.db";
    options.UseSqlite(connectionString);
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    EnsureUserAccountEmailSchema(db);
    EnsureDefaultAuthAccount(db);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors();
app.UseAuthorization();
app.MapControllers();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();

static void EnsureUserAccountEmailSchema(AppDbContext db)
{
    TryExecuteSql(db, """
        ALTER TABLE UserAccounts
        ADD COLUMN FullName TEXT NOT NULL DEFAULT '';
    """);

    TryExecuteSql(db, """
        ALTER TABLE UserAccounts
        ADD COLUMN Email TEXT NOT NULL DEFAULT '';
    """);

    TryExecuteSql(db, """
        ALTER TABLE UserAccounts
        ADD COLUMN NormalizedEmail TEXT NOT NULL DEFAULT '';
    """);

    TryExecuteSql(db, """
        CREATE UNIQUE INDEX IF NOT EXISTS IX_UserAccounts_NormalizedEmail
        ON UserAccounts (NormalizedEmail)
        WHERE NormalizedEmail <> '';
    """);
}

static void TryExecuteSql(AppDbContext db, string sql)
{
    try
    {
        db.Database.ExecuteSqlRaw(sql);
    }
    catch
    {
        // Ignore schema-already-exists errors to keep startup idempotent.
    }
}

static void EnsureDefaultAuthAccount(AppDbContext db)
{
    const string email = "a@gmail.com";
    const string password = "a";
    const string fullName = "Team Account";

    var normalizedEmail = email.ToUpperInvariant();
    var accountExists = db.UserAccounts.Any(x => x.NormalizedEmail == normalizedEmail);
    if (accountExists)
    {
        return;
    }

    db.UserAccounts.Add(new UserAccount
    {
        FullName = fullName,
        Username = email,
        NormalizedUsername = email.ToUpperInvariant(),
        Email = email,
        NormalizedEmail = normalizedEmail,
        PasswordHash = PasswordHashService.HashPassword(password),
        CreatedUtc = DateTime.UtcNow
    });

    db.SaveChanges();
}
