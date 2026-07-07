using SafeGuardApp.Models;
using SafeGuardApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace SafeGuardApp.Controllers;

[ApiController]
[Route("api/media")]
public sealed class MediaController : ControllerBase
{
    private readonly MediaUploadService _mediaUploadService;

    public MediaController(MediaUploadService mediaUploadService)
    {
        _mediaUploadService = mediaUploadService;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(250 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 250 * 1024 * 1024)]
    public async Task<ActionResult<MediaUploadResponse>> Upload([FromForm] string role, [FromForm] string category, CancellationToken cancellationToken)
    {
        if (!Request.HasFormContentType)
        {
            return BadRequest("Upload must use multipart/form-data.");
        }

        try
        {
            var files = await _mediaUploadService.SaveAsync(Request.Form.Files, role, category, cancellationToken);
            return Ok(new MediaUploadResponse { Files = files });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("uploads")]
    public ActionResult<IReadOnlyList<MediaUploadItem>> List([FromQuery] string? role, [FromQuery] string? category, [FromQuery] int take = 100)
    {
        return Ok(_mediaUploadService.ListRecent(role, category, take));
    }
}
