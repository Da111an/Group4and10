using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[IgnoreAntiforgeryToken]
public class AntiforgeryController(IAntiforgery antiforgery) : ControllerBase
{
    /// <summary>
    /// Call this endpoint once on app load. It sets the XSRF-TOKEN cookie
    /// which the frontend must read and send back as the X-XSRF-TOKEN header
    /// on every POST, PUT, DELETE, or PATCH request.
    /// </summary>
    [HttpGet("token")]
    public IActionResult GetToken()
    {
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken!, new CookieOptions
        {
            HttpOnly = false,
            Secure = true,
            SameSite = SameSiteMode.Strict
        });

        return Ok(new { message = "CSRF token issued." });
    }
}
