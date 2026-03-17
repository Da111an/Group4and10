namespace Server.Services;

public class PasswordHasherService
{
    // Work factor of 12 is the recommended minimum for production (higher = slower = more secure)
    private const int WorkFactor = 12;

    /// <summary>
    /// Hashes a plain-text passcode. Call this on registration before saving to the database.
    /// </summary>
    public string Hash(string passcode) =>
        BCrypt.Net.BCrypt.HashPassword(passcode, WorkFactor);

    /// <summary>
    /// Verifies a plain-text passcode against a stored hash. Call this on login.
    /// Returns true if the passcode matches, false otherwise.
    /// </summary>
    public bool Verify(string passcode, string hash) =>
        BCrypt.Net.BCrypt.Verify(passcode, hash);
}
