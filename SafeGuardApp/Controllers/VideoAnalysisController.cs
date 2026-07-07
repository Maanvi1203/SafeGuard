using SafeGuardApp.Hubs;
using SafeGuardApp.Models;
using SafeGuardApp.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace SafeGuardApp.Controllers;

[ApiController]
[Route("api/video-analysis")]
public sealed class VideoAnalysisController : ControllerBase
{
    private readonly VideoAnalysisService _analysis;
    private readonly IHubContext<AlertHub> _hub;

    public VideoAnalysisController(VideoAnalysisService analysis, IHubContext<AlertHub> hub)
    {
        _analysis = analysis;
        _hub = hub;
    }

    [HttpGet("events")]
    public ActionResult<IReadOnlyList<VideoAnalysisEvent>> Events()
    {
        return Ok(_analysis.GetRecentEvents());
    }

    [HttpPost("events")]
    public async Task<ActionResult<VideoAnalysisEvent>> Save(VideoAnalysisEvent videoEvent)
    {
        var saved = _analysis.Save(videoEvent);
        if (saved.Confidence >= saved.Threshold)
        {
            await _hub.Clients.Group("Admin").SendAsync("VideoRiskConfirmed", saved);
        }
        return Ok(saved);
    }
}
