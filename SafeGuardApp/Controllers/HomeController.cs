using Microsoft.AspNetCore.Mvc;

namespace SafeGuardApp.Controllers;

public class HomeController : Controller
{
    public IActionResult Index()
    {
        return RedirectToAction("Dashboard", "Operator");
    }
}
