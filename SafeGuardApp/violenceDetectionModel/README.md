# Fight/Violence Detection Dataset and Model Overview

This folder is the SafeGuard app drop-in location for the YOLOv8 fight/violence detection files from the open-source reference project.

Expected browser-side ONNX file:

```txt
violenceDetectionModel/Yolo_nano_weights.onnx
```

Optional Python-side weights:

```txt
violenceDetectionModel/Yolo_nano_weights.pt
violenceDetectionModel/yolo_small_weights.onnx
violenceDetectionModel/yolo_small_weights.pt
```

The Operator Action page loads `/violenceDetectionModel/Yolo_nano_weights.onnx` through ONNX Runtime Web. If the ONNX file is missing or camera permission is denied, the page falls back to demo mode instead of crashing.

## Dataset Overview

- Violence/Fight: physical confrontation present.
- NoViolence/NoFight: no physical confrontation.

## Reference project

```txt
https://github.com/Musawer1214/Fight-Violence-detection-yolov8
```

## Python prerequisites

```txt
Python 3.8+
Ultralytics YOLOv8
PyTorch
OpenCV
```

## Python camera command example

```bash
python -c "from ultralytics import YOLO; m=YOLO(r'violenceDetectionModel\Yolo_small_weights.pt'); m.predict(source=0, conf=0.5, classes=[1], show=True, save=False)"
```

Large `.onnx` and `.pt` files are not included in this package unless you add them before deployment.
