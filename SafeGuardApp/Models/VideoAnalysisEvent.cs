namespace SafeGuardApp.Models;

public sealed class VideoAnalysisEvent
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public DateTime Time { get; set; } = DateTime.UtcNow;
    public string Source { get; set; } = string.Empty;
    public string ClassName { get; set; } = "Violence/Fight";
    public double Confidence { get; set; }
    public double Threshold { get; set; } = 70;
    public string? ReportId { get; set; }
    public string? Route { get; set; }
    public string? BusId { get; set; }
    public string? Location { get; set; }
    public string Action { get; set; } = "Logged";
}
