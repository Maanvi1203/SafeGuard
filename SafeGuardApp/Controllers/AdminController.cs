using Microsoft.AspNetCore.Mvc;

namespace SafeGuardApp.Controllers;

public class AdminController : Controller
{
    private void SetRoleContext(string activePage)
    {
        ViewData["Role"] = "Admin";
        ViewData["ActivePage"] = activePage;
        ViewData["Title"] = $"{activePage} - SafeGuard App";
    }

    public IActionResult Dashboard()
    {
        SetRoleContext("Dashboard");
        return View();
    }

    public IActionResult Reports()
    {
        SetRoleContext("Reports");
        return View();
    }

    public IActionResult Alerts()
    {
        SetRoleContext("Alerts");
        return View();
    }

    public IActionResult Action()
    {
        SetRoleContext("Action");
        return View();
    }

    public IActionResult Settings()
    {
        SetRoleContext("Settings");
        return View();
    }
}
