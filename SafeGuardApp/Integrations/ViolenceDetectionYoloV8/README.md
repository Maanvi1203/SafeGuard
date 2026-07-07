# Violence Detection YOLOv8 Integration

Source project: https://github.com/Musawer1214/Fight-Violence-detection-yolov8

This folder is an integration scaffold for connecting SafeGuard App to the YOLOv8 fight/violence detector. The linked project describes YOLOv8 nano/small models trained for Violence/Fight and NoViolence/NoFight classes. Use your approved model weights in this folder as `weights/best.pt` or configure the path in environment settings.

## Intended flow

1. Camera frame or uploaded rider clip is analyzed by a Python worker.
2. Worker emits `Violence/Fight` confidence scores.
3. SafeGuard receives the event through `/api/video-analysis/events`.
4. If confidence is above threshold, Admin receives a SignalR alert.

## Files

```txt
video_analysis_worker.py      Python worker scaffold
requirements.txt             Python packages for local worker
weights/.gitkeep             Put approved YOLOv8 weights here
```

The current UI includes a browser-side simulation so the Operator Action page can be reviewed without GPU/Python setup.
