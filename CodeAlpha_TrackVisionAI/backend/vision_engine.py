from __future__ import annotations

import threading
import time
from collections import Counter
from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO

from sort_tracker import Sort


def color_for_id(track_id: int) -> tuple[int, int, int]:
    # Deterministic bright BGR color per track ID.
    b = 80 + (track_id * 67) % 175
    g = 80 + (track_id * 97) % 175
    r = 80 + (track_id * 137) % 175
    return int(b), int(g), int(r)


class VisionEngine:
    def __init__(self, model_name: str = "yolov8n.pt"):
        self.model_name = model_name
        self.model = YOLO(model_name)

        self.tracker = Sort(
            max_age=18,
            min_hits=2,
            iou_threshold=0.25,
        )

        self.confidence = 0.40
        self.iou = 0.45

        self.capture = None
        self.source_type = None
        self.source_path = None

        self.running = False
        self.lock = threading.RLock()

        self.last_frame = None
        self.last_frame_time = 0.0

        self.stats = {
            "running": False,
            "source_type": None,
            "fps": 0.0,
            "detections": 0,
            "tracks": 0,
            "counts": {},
            "frame_width": 0,
            "frame_height": 0,
        }

    @property
    def class_names(self):
        return self.model.names

    def set_settings(self, confidence: float, iou: float):
        with self.lock:
            self.confidence = max(0.05, min(float(confidence), 0.95))
            self.iou = max(0.10, min(float(iou), 0.90))

    def _release_capture(self):
        if self.capture is not None:
            try:
                self.capture.release()
            except Exception:
                pass

        self.capture = None

    def stop(self):
        with self.lock:
            self.running = False
            self._release_capture()
            self.tracker.reset()
            self.last_frame = None
            self.source_type = None
            self.source_path = None

            self.stats = {
                "running": False,
                "source_type": None,
                "fps": 0.0,
                "detections": 0,
                "tracks": 0,
                "counts": {},
                "frame_width": 0,
                "frame_height": 0,
            }

    def start_webcam(self, index: int = 0) -> bool:
        with self.lock:
            self.stop()

            capture = cv2.VideoCapture(index)

            if not capture.isOpened():
                capture.release()
                return False

            capture.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

            self.capture = capture
            self.source_type = "webcam"
            self.source_path = str(index)
            self.running = True
            self.tracker.reset()

            return True

    def start_video(self, path: str | Path) -> bool:
        with self.lock:
            self.stop()

            capture = cv2.VideoCapture(str(path))

            if not capture.isOpened():
                capture.release()
                return False

            self.capture = capture
            self.source_type = "video"
            self.source_path = str(path)
            self.running = True
            self.tracker.reset()

            return True

    def _detection_array(self, result) -> np.ndarray:
        detections = []

        if result.boxes is None:
            return np.empty((0, 6), dtype=np.float32)

        xyxy = result.boxes.xyxy.detach().cpu().numpy()
        conf = result.boxes.conf.detach().cpu().numpy()
        classes = result.boxes.cls.detach().cpu().numpy()

        for box, score, class_id in zip(xyxy, conf, classes):
            detections.append(
                [
                    float(box[0]),
                    float(box[1]),
                    float(box[2]),
                    float(box[3]),
                    float(score),
                    float(class_id),
                ]
            )

        return (
            np.asarray(detections, dtype=np.float32)
            if detections
            else np.empty((0, 6), dtype=np.float32)
        )

    def process_frame(self, frame: np.ndarray):
        started = time.perf_counter()

        results = self.model.predict(
            source=frame,
            conf=self.confidence,
            iou=self.iou,
            verbose=False,
            imgsz=640,
        )

        result = results[0]
        detections = self._detection_array(result)
        tracks = self.tracker.update(detections)

        class_counts = Counter()

        annotated = frame.copy()

        for track in tracks:
            x1, y1, x2, y2 = track.bbox.astype(int)

            height, width = annotated.shape[:2]

            x1 = max(0, min(x1, width - 1))
            y1 = max(0, min(y1, height - 1))
            x2 = max(0, min(x2, width - 1))
            y2 = max(0, min(y2, height - 1))

            class_name = str(
                self.class_names.get(track.class_id, track.class_id)
                if isinstance(self.class_names, dict)
                else self.class_names[track.class_id]
            )

            class_counts[class_name] += 1

            color = color_for_id(track.track_id)

            cv2.rectangle(
                annotated,
                (x1, y1),
                (x2, y2),
                color,
                2,
            )

            label = (
                f"{class_name}  #{track.track_id}  "
                f"{track.confidence:.2f}"
            )

            (text_width, text_height), baseline = cv2.getTextSize(
                label,
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                2,
            )

            label_top = max(0, y1 - text_height - baseline - 10)

            cv2.rectangle(
                annotated,
                (x1, label_top),
                (x1 + text_width + 12, y1),
                color,
                -1,
            )

            cv2.putText(
                annotated,
                label,
                (x1 + 6, max(text_height + 2, y1 - 7)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (12, 18, 25),
                2,
                cv2.LINE_AA,
            )

        elapsed = max(1e-6, time.perf_counter() - started)
        instant_fps = 1.0 / elapsed

        previous_fps = float(self.stats.get("fps", 0.0))
        smoothed_fps = (
            instant_fps
            if previous_fps <= 0
            else previous_fps * 0.82 + instant_fps * 0.18
        )

        frame_height, frame_width = annotated.shape[:2]

        self.stats = {
            "running": self.running,
            "source_type": self.source_type,
            "fps": round(smoothed_fps, 2),
            "detections": int(len(detections)),
            "tracks": int(len(tracks)),
            "counts": dict(class_counts),
            "frame_width": int(frame_width),
            "frame_height": int(frame_height),
        }

        return annotated

    def read_processed_frame(self):
        with self.lock:
            if not self.running or self.capture is None:
                return None

            ok, frame = self.capture.read()

            if not ok:
                if self.source_type == "video":
                    self.running = False
                    self._release_capture()
                    self.stats["running"] = False

                return None

        processed = self.process_frame(frame)

        with self.lock:
            self.last_frame = processed
            self.last_frame_time = time.time()

        return processed

    def get_stats(self):
        with self.lock:
            result = dict(self.stats)
            result["running"] = bool(self.running)
            result["source_type"] = self.source_type
            return result
