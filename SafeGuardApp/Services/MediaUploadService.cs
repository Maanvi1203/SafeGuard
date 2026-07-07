using SafeGuardApp.Models;

namespace SafeGuardApp.Services;

public sealed class MediaUploadService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic",
        ".mp4", ".mov", ".webm",
        ".mp3", ".wav", ".m4a", ".ogg",
        ".pdf", ".doc", ".docx", ".txt"
    };

    private const long MaxFileSizeBytes = 50 * 1024 * 1024;
    private readonly IWebHostEnvironment _environment;

    public MediaUploadService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<IReadOnlyList<MediaUploadItem>> SaveAsync(IFormFileCollection files, string role, string category, CancellationToken cancellationToken)
    {
        if (files.Count == 0) return Array.Empty<MediaUploadItem>();

        var safeRole = SanitizeSegment(role, "general");
        var safeCategory = SanitizeSegment(category, "incident");
        var dateFolder = DateTime.UtcNow.ToString("yyyyMMdd");
        var uploadRoot = Path.Combine(_environment.WebRootPath, "media", "uploads", safeRole, safeCategory, dateFolder);
        Directory.CreateDirectory(uploadRoot);

        var savedFiles = new List<MediaUploadItem>();
        foreach (var file in files)
        {
            if (file.Length <= 0) continue;
            if (file.Length > MaxFileSizeBytes)
            {
                throw new InvalidOperationException($"{file.FileName} is larger than the 50 MB upload limit.");
            }

            var extension = Path.GetExtension(file.FileName);
            if (!AllowedExtensions.Contains(extension))
            {
                throw new InvalidOperationException($"{file.FileName} is not an allowed media or document type.");
            }

            var id = Guid.NewGuid().ToString("N");
            var storedName = $"{id}{extension.ToLowerInvariant()}";
            var filePath = Path.Combine(uploadRoot, storedName);

            await using (var stream = File.Create(filePath))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            var contentType = string.IsNullOrWhiteSpace(file.ContentType) ? GuessContentType(extension) : file.ContentType;
            savedFiles.Add(new MediaUploadItem
            {
                Id = id,
                OriginalName = Path.GetFileName(file.FileName),
                StoredName = storedName,
                Url = $"/media/uploads/{safeRole}/{safeCategory}/{dateFolder}/{storedName}",
                ContentType = contentType,
                MediaType = GetMediaType(contentType, extension),
                SizeBytes = file.Length,
                Role = safeRole,
                Category = safeCategory,
                UploadedAt = DateTime.UtcNow
            });
        }

        return savedFiles;
    }

    public IReadOnlyList<MediaUploadItem> ListRecent(string? role = null, string? category = null, int take = 100)
    {
        var root = Path.Combine(_environment.WebRootPath, "media", "uploads");
        if (!Directory.Exists(root)) return Array.Empty<MediaUploadItem>();

        var files = Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories)
            .Where(path => Path.GetFileName(path) != ".gitkeep")
            .Select(path => ToMediaItem(root, path))
            .Where(item => string.IsNullOrWhiteSpace(role) || item.Role.Equals(SanitizeSegment(role, string.Empty), StringComparison.OrdinalIgnoreCase))
            .Where(item => string.IsNullOrWhiteSpace(category) || item.Category.Equals(SanitizeSegment(category, string.Empty), StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(item => item.UploadedAt)
            .Take(Math.Clamp(take, 1, 250))
            .ToList();

        return files;
    }

    private static MediaUploadItem ToMediaItem(string root, string path)
    {
        var relative = Path.GetRelativePath(root, path).Replace(Path.DirectorySeparatorChar, '/');
        var parts = relative.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var extension = Path.GetExtension(path);
        var contentType = GuessContentType(extension);
        var info = new FileInfo(path);
        return new MediaUploadItem
        {
            Id = Path.GetFileNameWithoutExtension(path),
            OriginalName = Path.GetFileName(path),
            StoredName = Path.GetFileName(path),
            Url = $"/media/uploads/{relative}",
            ContentType = contentType,
            MediaType = GetMediaType(contentType, extension),
            SizeBytes = info.Length,
            Role = parts.Length > 0 ? parts[0] : "general",
            Category = parts.Length > 1 ? parts[1] : "incident",
            UploadedAt = info.CreationTimeUtc
        };
    }

    private static string SanitizeSegment(string? value, string fallback)
    {
        var raw = string.IsNullOrWhiteSpace(value) ? fallback : value.Trim().ToLowerInvariant();
        var chars = raw.Select(ch => char.IsLetterOrDigit(ch) || ch == '-' ? ch : '-').ToArray();
        var cleaned = new string(chars).Trim('-');
        return string.IsNullOrWhiteSpace(cleaned) ? fallback : cleaned;
    }

    private static string GuessContentType(string extension) => extension.ToLowerInvariant() switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".webp" => "image/webp",
        ".gif" => "image/gif",
        ".heic" => "image/heic",
        ".mp4" => "video/mp4",
        ".mov" => "video/quicktime",
        ".webm" => "video/webm",
        ".mp3" => "audio/mpeg",
        ".wav" => "audio/wav",
        ".m4a" => "audio/mp4",
        ".ogg" => "audio/ogg",
        ".pdf" => "application/pdf",
        ".doc" => "application/msword",
        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt" => "text/plain",
        _ => "application/octet-stream"
    };

    private static string GetMediaType(string contentType, string extension)
    {
        if (contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)) return "image";
        if (contentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase)) return "video";
        if (contentType.StartsWith("audio/", StringComparison.OrdinalIgnoreCase)) return "audio";
        if (extension.Equals(".pdf", StringComparison.OrdinalIgnoreCase) || extension.Equals(".doc", StringComparison.OrdinalIgnoreCase) || extension.Equals(".docx", StringComparison.OrdinalIgnoreCase) || extension.Equals(".txt", StringComparison.OrdinalIgnoreCase)) return "document";
        return "file";
    }
}
