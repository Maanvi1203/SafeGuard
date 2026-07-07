# SafeGuard App

ASP.NET Core MVC project for the SafeGuard transit safety app.

## Included now

- Shared layout for all roles
- Topbar role switcher
- Sidebar navigation: Dashboard, Reports, Alerts, Action, Settings
- Completed Operator interface with report validation, incident reporting, alerts, actions, settings, and YOLOv8 video-analysis scaffold
- Completed Rider interface with incident submission, report status tracking, route alerts, help actions, and settings
- Completed Management interface with safety trend dashboard, report review, escalated alert feed, response action tracking, and settings
- Completed Admin interface with system dashboard, all-report audit, escalated alert feed, video event review, workflow decisions, access control, and settings
- TTC images, icons, source documents, role-specific PDF guides, JSON data, and sample audio

## Role flows

```txt
Operator
- Validates Rider reports
- Creates Operator incident reports
- Acknowledges, escalates, closes, or requests more information
- Flags linked video risk for Admin review

Rider
- Submits incident reports
- Tracks report status
- Views public route safety alerts
- Uses quick help actions

Management
- Reviews safety trends and depot/route risk patterns
- Reviews validated reports and escalated alerts
- Adds response notes and tracks action follow-up

Admin
- Receives escalated reports and video risk events
- Audits all reports
- Saves admin decisions
- Manages access, alert rules, and media documents
```

## Role reference documents

```txt
wwwroot/documents/operator-risk-response-guide.pdf
wwwroot/documents/rider-safety-precautions-guide.pdf
wwwroot/documents/management-risk-oversight-guide.pdf
wwwroot/documents/admin-system-safety-guide.pdf
```

Each role Settings page opens its own PDF guide. The documents cover role-specific risks, precautions, help options, and recommended actions. The original TTC risk assessment DOCX and route/division DOCX remain available under `wwwroot/documents/`.

## YOLOv8 video analysis integration

Reference project:

```txt
https://github.com/Musawer1214/Fight-Violence-detection-yolov8
```

Integration scaffold:

```txt
Integrations/ViolenceDetectionYoloV8/
```

The Operator Action page now supports browser-side ONNX Runtime Web analysis. Place the exported YOLOv8 ONNX model here:

```txt
violenceDetectionModel/Yolo_nano_weights.onnx
```

The app serves this folder at:

```txt
/violenceDetectionModel/Yolo_nano_weights.onnx
```

If the model file is unavailable or camera permission is denied, the Action page falls back to demo mode instead of breaking.

For server-side/Python processing, place approved YOLOv8 `.pt` weights under:

```txt
Integrations/ViolenceDetectionYoloV8/weights/best.pt
```

Then run the Python worker and post confirmed events into:

```txt
/api/video-analysis/events
```

## Role file locations

```txt
Controllers/OperatorController.cs
Controllers/RiderController.cs
Controllers/ManagementController.cs
Controllers/AdminController.cs

Views/Operator/
Views/Rider/
Views/Management/
Views/Admin/

wwwroot/js/operator-*.js
wwwroot/js/rider-*.js
wwwroot/js/management-*.js
wwwroot/js/admin-*.js
```

## Run

```bash
dotnet restore
dotnet run
```

Default route:

```txt
/Operator/Dashboard
```

Static preview:

```txt
wwwroot/operator-preview.html
```

## Media upload support

SafeGuard now supports media uploads for incident reports and admin media documents.

Upload locations:

```txt
wwwroot/media/uploads/{role}/{category}/{yyyyMMdd}/
```

Supported upload types:

```txt
Images: .jpg, .jpeg, .png, .webp, .gif, .heic
Video: .mp4, .mov, .webm
Audio: .mp3, .wav, .m4a, .ogg, recorded .webm voice notes
Documents: .pdf, .doc, .docx, .txt
```

Backend endpoints:

```txt
POST /api/media/upload
GET  /api/media/uploads
```

Updated interfaces:

```txt
Operator Reports: attach evidence when creating an operator incident.
Rider Reports: attach media when submitting a rider report.
Admin Settings: upload and review media documents in the media library.
Management/Admin report review: displays uploaded media counts or attachments where available.
```

For production on Render, store uploaded media in object storage instead of relying only on the local filesystem. Render web service filesystems can be temporary across deploys/restarts unless persistent storage or external object storage is configured.

## Voice notes and live location

Operator and Rider incident forms now include:

```txt
Voice Note: record a short browser microphone note and upload it with the report media.
Use Live Location: capture the device latitude/longitude, accuracy, and a Google Maps reverse-geocoded address when a Google Maps API key is configured.
```

Configuration:

```json
"GoogleMaps": {
  "ApiKey": "YOUR_RESTRICTED_BROWSER_KEY"
}
```

For Render, add the environment variable instead:

```txt
GOOGLE_MAPS_API_KEY=YOUR_RESTRICTED_BROWSER_KEY
```

Required Google Maps Platform APIs:

```txt
Maps JavaScript API
Geocoding API
```

If no Google key is configured, SafeGuard still captures browser GPS coordinates and provides a Google Maps link. Voice recording and live location require browser permission and HTTPS in production.
