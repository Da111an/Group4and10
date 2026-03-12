using Microsoft.AspNetCore.Mvc;

namespace Server.Controllers;

public class HomeController : Controller
{
    [HttpGet("/")]
    public IActionResult Index()
    {
        return View();
    }

    [HttpGet("/dashboard")]
    public IActionResult Dashboard()
    {
        return View();
    }
}
