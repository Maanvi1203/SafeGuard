using SafeGuardApp.Models;

namespace SafeGuardApp.Services;

public sealed class VideoAnalysisService
{
    private readonly List<VideoAnalysisEvent> _events = new();

    public IReadOnlyList<VideoAnalysisEvent> GetRecentEvents()
    {
        return _events.OrderByDescending(e => e.Time).Take(50).ToList();
    }

    public VideoAnalysisEvent Save(VideoAnalysisEvent videoEvent)
    {
        videoEvent.Id = string.IsNullOrWhiteSpace(videoEvent.Id) ? Guid.NewGuid().ToString("N") : videoEvent.Id;
        videoEvent.Time = videoEvent.Time == default ? DateTime.UtcNow : videoEvent.Time;
        _events.Insert(0, videoEvent);
        return videoEvent;
    }
}
