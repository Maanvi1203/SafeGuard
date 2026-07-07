namespace SafeGuardApp.Models;

public enum OperatorReportStatus
{
    Pending,
    Acknowledged,
    Escalated,
    Closed
}

public sealed class OperatorReport
{
    public string Id { get; set; } = string.Empty;
    public string Source { get; set; } = "Rider";
    public string ReporterName { get; set; } = string.Empty;
    public DateTime Time { get; set; }
    public string Route { get; set; } = string.Empty;
    public string BusId { get; set; } = string.Empty;
    public string RiskType { get; set; } = string.Empty;
    public string Severity { get; set; } = "Medium";
    public string Location { get; set; } = string.Empty;
    public string Division { get; set; } = string.Empty;
    public string Direction { get; set; } = string.Empty;
    public string NearestStop { get; set; } = string.Empty;
    public string NextStop { get; set; } = string.Empty;
    public string Latitude { get; set; } = string.Empty;
    public string Longitude { get; set; } = string.Empty;
    public string LocationAccuracy { get; set; } = string.Empty;
    public string LocationSource { get; set; } = string.Empty;
    public OperatorReportStatus Status { get; set; } = OperatorReportStatus.Pending;
    public int Confidence { get; set; } = 100;
    public string AudioClipUrl { get; set; } = string.Empty;
    public string[] Keywords { get; set; } = Array.Empty<string>();
    public string Transcript { get; set; } = string.Empty;
    public string OperatorNotes { get; set; } = string.Empty;
    public string MediaNotes { get; set; } = string.Empty;
    public bool HasPhoto { get; set; }
    public bool HasVideo { get; set; }
    public bool HasAudio { get; set; }
    public bool HasDocument { get; set; }
    public List<MediaUploadItem> MediaFiles { get; set; } = new();
}
