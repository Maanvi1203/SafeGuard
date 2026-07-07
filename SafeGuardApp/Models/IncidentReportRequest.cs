namespace SafeGuardApp.Models;

public sealed class IncidentReportRequest
{
    public string RiskType { get; set; } = string.Empty;
    public string Severity { get; set; } = "Medium";
    public string Route { get; set; } = string.Empty;
    public string BusId { get; set; } = string.Empty;
    public string Direction { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string NearestStop { get; set; } = string.Empty;
    public string Latitude { get; set; } = string.Empty;
    public string Longitude { get; set; } = string.Empty;
    public string LocationAccuracy { get; set; } = string.Empty;
    public string LocationSource { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string MediaNotes { get; set; } = string.Empty;
    public bool HasPhoto { get; set; }
    public bool HasVideo { get; set; }
    public bool HasAudio { get; set; }
    public bool HasDocument { get; set; }
    public List<MediaUploadItem> MediaFiles { get; set; } = new();
}
