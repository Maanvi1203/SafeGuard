using SafeGuardApp.Models;

namespace SafeGuardApp.Services;

public sealed class OperatorReportService
{
    private readonly List<OperatorReport> _reports = new();

    public IReadOnlyList<OperatorReport> GetAssignedReports(string division)
    {
        return _reports.Where(r => r.Division == division || r.Division == "Shared / All Divisions").ToList();
    }

    public OperatorReport? Find(string id)
    {
        return _reports.FirstOrDefault(r => r.Id == id);
    }

    public OperatorReport CreateOperatorIncident(IncidentReportRequest request, string operatorName, string division)
    {
        var report = new OperatorReport
        {
            Id = $"OP-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}",
            Source = "Operator",
            ReporterName = operatorName,
            Time = DateTime.UtcNow,
            Status = OperatorReportStatus.Acknowledged,
            RiskType = request.RiskType,
            Severity = request.Severity,
            Route = request.Route,
            BusId = request.BusId,
            Direction = request.Direction,
            Location = request.Location,
            NearestStop = request.NearestStop,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            LocationAccuracy = request.LocationAccuracy,
            LocationSource = request.LocationSource,
            Division = division,
            Transcript = $"Operator-created incident. {request.Details}".Trim(),
            OperatorNotes = request.Details,
            MediaNotes = request.MediaNotes,
            HasPhoto = request.HasPhoto,
            HasVideo = request.HasVideo,
            HasAudio = request.HasAudio,
            HasDocument = request.HasDocument,
            MediaFiles = request.MediaFiles,
            AudioClipUrl = "/media/audio/normal-check.wav",
            Keywords = new[] { request.RiskType, "operator report" }
        };

        _reports.Insert(0, report);
        return report;
    }
}
