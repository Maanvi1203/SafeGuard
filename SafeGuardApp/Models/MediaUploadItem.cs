namespace SafeGuardApp.Models;

public sealed class MediaUploadItem
{
    public string Id { get; set; } = string.Empty;
    public string OriginalName { get; set; } = string.Empty;
    public string StoredName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string MediaType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

public sealed class MediaUploadResponse
{
    public IReadOnlyList<MediaUploadItem> Files { get; set; } = Array.Empty<MediaUploadItem>();
}
