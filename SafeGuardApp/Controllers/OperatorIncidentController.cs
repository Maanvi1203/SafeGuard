using SafeGuardApp.Models;
using SafeGuardApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace SafeGuardApp.Controllers;

[ApiController]
[Route("api/operator/incidents")]
public sealed class OperatorIncidentController : ControllerBase
{
    private readonly OperatorReportService _reports;

    public OperatorIncidentController(OperatorReportService reports)
    {
        _reports = reports;
    }

    [HttpPost]
    public ActionResult<OperatorReport> Create(IncidentReportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RiskType) || string.IsNullOrWhiteSpace(request.Details))
        {
            return BadRequest("Risk type and details are required.");
        }

        var report = _reports.CreateOperatorIncident(request, "Sam Patel", "Eglinton Division");
        return Created($"/Operator/Reports#{report.Id}", report);
    }
}
