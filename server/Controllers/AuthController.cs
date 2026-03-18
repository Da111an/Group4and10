using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;
using Server.Data;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AuthController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] AuthRequest request)
    {
        var fullName = (request.FullName ?? string.Empty).Trim();
        var email = (request.Email ?? string.Empty).Trim();
        var password = request.Password ?? string.Empty;

        if (fullName.Length == 0 || fullName.Length > 120)
        {
            return BadRequest(new { message = "Please enter your full name." });
        }

        if (!IsValidEmail(email))
        {
            return BadRequest(new { message = "Please enter a valid email address." });
        }

        var normalizedEmail = NormalizeEmail(email);
        var emailInUse = await _dbContext.UserAccounts.AnyAsync(x => x.NormalizedEmail == normalizedEmail);
        if (emailInUse)
        {
            return Conflict(new { message = "That email is already in use." });
        }

        var derivedUsername = email;
        var user = new UserAccount
        {
            FullName = fullName,
            Username = derivedUsername,
            NormalizedUsername = NormalizeUsername(derivedUsername),
            Email = email,
            NormalizedEmail = normalizedEmail,
            PasswordHash = PasswordHashService.HashPassword(password),
            CreatedUtc = DateTime.UtcNow
        };

        _dbContext.UserAccounts.Add(user);
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Account created successfully.", email = user.Email, fullName = user.FullName });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AuthRequest request)
    {
        var email = (request.Email ?? string.Empty).Trim();
        var password = request.Password ?? string.Empty;
        var normalizedEmail = NormalizeEmail(email);

        var user = await _dbContext.UserAccounts.SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail);
        if (user is null || !PasswordHashService.VerifyPassword(password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        user.LastLoginUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Sign in successful.", email = user.Email, fullName = user.FullName });
    }

    private static string NormalizeUsername(string username) =>
        username.Trim().ToUpperInvariant();

    private static string NormalizeEmail(string email) =>
        email.Trim().ToUpperInvariant();

    private static bool IsValidEmail(string email)
    {
        try
        {
            _ = new MailAddress(email);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public record AuthRequest(string? Password, string? Email, string? FullName);
}
