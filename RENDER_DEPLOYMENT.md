# SafeGuard Render Deployment Guide

## Manual Render setup

1. Push this repository to GitHub.
2. In Render, choose **New +** → **Web Service**.
3. Connect the GitHub repository.
4. Use these settings:

| Setting | Value |
|---|---|
| Runtime / Language | Docker |
| Branch | main |
| Root Directory | SafeGuardApp |
| Dockerfile Path | Dockerfile |
| Build Command | leave blank |
| Start Command / Docker Command | leave blank |
| Health Check Path | /healthz |

Because the service root is `SafeGuardApp`, the Dockerfile path is `Dockerfile`, not `SafeGuardApp/Dockerfile`.

## Environment variables

Add these in Render:

```txt
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_FORWARDEDHEADERS_ENABLED=true
GOOGLE_MAPS_API_KEY=<your key, optional for live location address lookup>
```

The app still captures browser GPS coordinates without a Google key. The key is only needed for Google-backed map/geocoding features.

## After deploy

Open:

```txt
https://<your-service-name>.onrender.com/
```

The default route opens the Operator dashboard. Use the top-right role switcher to open Rider, Management, or Admin.

## Notes for demo

Media uploads and voice notes write to `wwwroot/media/uploads` inside the Render container. That is fine for a demo, but these uploads can be lost when the service redeploys or restarts. For production, connect object storage or a persistent disk.
