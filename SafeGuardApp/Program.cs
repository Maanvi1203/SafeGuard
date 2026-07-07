using SafeGuardApp.Hubs;
using SafeGuardApp.Services;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddSignalR();
builder.Services.AddSingleton<OperatorReportService>();
builder.Services.AddSingleton<VideoAnalysisService>();
builder.Services.AddSingleton<MediaUploadService>();

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();

var staticFileTypes = new FileExtensionContentTypeProvider();
staticFileTypes.Mappings[".onnx"] = "application/octet-stream";
staticFileTypes.Mappings[".pt"] = "application/octet-stream";
staticFileTypes.Mappings[".webm"] = "video/webm";
staticFileTypes.Mappings[".mov"] = "video/quicktime";
staticFileTypes.Mappings[".m4a"] = "audio/mp4";
staticFileTypes.Mappings[".ogg"] = "audio/ogg";
staticFileTypes.Mappings[".heic"] = "image/heic";

app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = staticFileTypes
});

var violenceModelPath = Path.Combine(builder.Environment.ContentRootPath, "violenceDetectionModel");
if (Directory.Exists(violenceModelPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(violenceModelPath),
        RequestPath = "/violenceDetectionModel",
        ContentTypeProvider = staticFileTypes,
        OnPrepareResponse = context =>
        {
            context.Context.Response.Headers.CacheControl = "public,max-age=3600";
        }
    });
}

app.UseRouting();

app.MapGet("/healthz", () => Results.Ok(new { status = "ok", app = "SafeGuard" }));

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Operator}/{action=Dashboard}/{id?}");

app.MapHub<AlertHub>("/hubs/alerts");

app.Run();
