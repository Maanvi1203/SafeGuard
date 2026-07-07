"""SafeGuard YOLOv8 video analysis worker scaffold.

Connect this worker to the approved model weights from the referenced open-source
YOLOv8 fight/violence detection project. This file is intentionally lightweight
so it can be wired to a camera stream, uploaded clip, or test video.
"""

from __future__ import annotations

import argparse
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import cv2
import requests
from ultralytics import YOLO


@dataclass
class DetectionEvent:
    source: str
    class_name: str
    confidence: float
    threshold: float


def analyze(source: str, weights: Path, threshold: float) -> Iterable[DetectionEvent]:
    model = YOLO(str(weights))
    capture = cv2.VideoCapture(source)
    if not capture.isOpened():
        raise RuntimeError(f"Unable to open video source: {source}")

    while True:
        ok, frame = capture.read()
        if not ok:
            break
        results = model.predict(frame, verbose=False)
        for result in results:
            for box in result.boxes:
                confidence = float(box.conf[0]) * 100
                class_id = int(box.cls[0])
                class_name = model.names.get(class_id, "Violence/Fight")
                if confidence >= threshold:
                    yield DetectionEvent(source=source, class_name=class_name, confidence=confidence, threshold=threshold)
        time.sleep(0.05)


def post_event(api_url: str, event: DetectionEvent) -> None:
    payload = {
        "source": event.source,
        "className": event.class_name,
        "confidence": round(event.confidence, 2),
        "threshold": event.threshold,
        "action": "Ready to flag for Admin Review",
    }
    requests.post(api_url, json=payload, timeout=10).raise_for_status()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="Camera index, stream URL, image, or video file")
    parser.add_argument("--weights", default="weights/best.pt")
    parser.add_argument("--threshold", type=float, default=70)
    parser.add_argument("--api-url", default="http://localhost:5000/api/video-analysis/events")
    args = parser.parse_args()

    for event in analyze(args.source, Path(args.weights), args.threshold):
        post_event(args.api_url, event)
        print(f"{event.class_name} {event.confidence:.1f}%")


if __name__ == "__main__":
    main()
