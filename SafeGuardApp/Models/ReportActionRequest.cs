namespace SafeGuardApp.Models;

public sealed class ReportActionRequest
{
    public string ReportId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string? MessageToRider { get; set; }
}
