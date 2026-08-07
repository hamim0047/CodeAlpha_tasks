from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from filterpy.kalman import KalmanFilter
from scipy.optimize import linear_sum_assignment


def iou_batch(boxes_a: np.ndarray, boxes_b: np.ndarray) -> np.ndarray:
    if len(boxes_a) == 0 or len(boxes_b) == 0:
        return np.empty((len(boxes_a), len(boxes_b)), dtype=np.float32)

    a = np.expand_dims(boxes_a, 1)
    b = np.expand_dims(boxes_b, 0)

    xx1 = np.maximum(a[..., 0], b[..., 0])
    yy1 = np.maximum(a[..., 1], b[..., 1])
    xx2 = np.minimum(a[..., 2], b[..., 2])
    yy2 = np.minimum(a[..., 3], b[..., 3])

    width = np.maximum(0.0, xx2 - xx1)
    height = np.maximum(0.0, yy2 - yy1)
    intersection = width * height

    area_a = np.maximum(0.0, (a[..., 2] - a[..., 0])) * np.maximum(
        0.0, (a[..., 3] - a[..., 1])
    )
    area_b = np.maximum(0.0, (b[..., 2] - b[..., 0])) * np.maximum(
        0.0, (b[..., 3] - b[..., 1])
    )

    union = area_a + area_b - intersection + 1e-6
    return intersection / union


def convert_bbox_to_z(bbox: np.ndarray) -> np.ndarray:
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]

    x = bbox[0] + width / 2.0
    y = bbox[1] + height / 2.0
    scale = width * height
    ratio = width / (height + 1e-6)

    return np.array([[x], [y], [scale], [ratio]], dtype=np.float32)


def convert_x_to_bbox(x: np.ndarray) -> np.ndarray:
    width = np.sqrt(max(0.0, float(x[2] * x[3])))
    height = float(x[2]) / (width + 1e-6)

    return np.array(
        [
            float(x[0]) - width / 2.0,
            float(x[1]) - height / 2.0,
            float(x[0]) + width / 2.0,
            float(x[1]) + height / 2.0,
        ],
        dtype=np.float32,
    )


@dataclass
class TrackOutput:
    bbox: np.ndarray
    track_id: int
    class_id: int
    confidence: float


class KalmanBoxTracker:
    count = 0

    def __init__(self, bbox: np.ndarray, class_id: int, confidence: float):
        self.kf = KalmanFilter(dim_x=7, dim_z=4)

        self.kf.F = np.array(
            [
                [1, 0, 0, 0, 1, 0, 0],
                [0, 1, 0, 0, 0, 1, 0],
                [0, 0, 1, 0, 0, 0, 1],
                [0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 0, 1, 0, 0],
                [0, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 0, 1],
            ],
            dtype=np.float32,
        )

        self.kf.H = np.array(
            [
                [1, 0, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0, 0],
                [0, 0, 1, 0, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0],
            ],
            dtype=np.float32,
        )

        self.kf.R[2:, 2:] *= 10.0
        self.kf.P[4:, 4:] *= 1000.0
        self.kf.P *= 10.0
        self.kf.Q[-1, -1] *= 0.01
        self.kf.Q[4:, 4:] *= 0.01

        self.kf.x[:4] = convert_bbox_to_z(bbox)

        KalmanBoxTracker.count += 1
        self.id = KalmanBoxTracker.count

        self.time_since_update = 0
        self.hits = 1
        self.hit_streak = 1
        self.age = 0

        self.class_id = int(class_id)
        self.confidence = float(confidence)

    def update(self, bbox: np.ndarray, class_id: int, confidence: float):
        self.time_since_update = 0
        self.hits += 1
        self.hit_streak += 1

        self.class_id = int(class_id)
        self.confidence = float(confidence)

        self.kf.update(convert_bbox_to_z(bbox))

    def predict(self) -> np.ndarray:
        if (self.kf.x[6] + self.kf.x[2]) <= 0:
            self.kf.x[6] *= 0.0

        self.kf.predict()
        self.age += 1

        if self.time_since_update > 0:
            self.hit_streak = 0

        self.time_since_update += 1

        return convert_x_to_bbox(self.kf.x)

    def get_state(self) -> np.ndarray:
        return convert_x_to_bbox(self.kf.x)


def associate_detections_to_trackers(
    detections: np.ndarray,
    trackers: np.ndarray,
    iou_threshold: float,
):
    if len(trackers) == 0:
        return (
            np.empty((0, 2), dtype=int),
            np.arange(len(detections)),
            np.empty((0,), dtype=int),
        )

    iou_matrix = iou_batch(detections[:, :4], trackers[:, :4])

    row_indices, col_indices = linear_sum_assignment(-iou_matrix)

    matched = []
    unmatched_detections = set(range(len(detections)))
    unmatched_trackers = set(range(len(trackers)))

    for det_index, track_index in zip(row_indices, col_indices):
        if iou_matrix[det_index, track_index] < iou_threshold:
            continue

        matched.append([det_index, track_index])
        unmatched_detections.discard(det_index)
        unmatched_trackers.discard(track_index)

    return (
        np.asarray(matched, dtype=int).reshape(-1, 2),
        np.asarray(sorted(unmatched_detections), dtype=int),
        np.asarray(sorted(unmatched_trackers), dtype=int),
    )


class Sort:
    def __init__(
        self,
        max_age: int = 18,
        min_hits: int = 2,
        iou_threshold: float = 0.25,
    ):
        self.max_age = max_age
        self.min_hits = min_hits
        self.iou_threshold = iou_threshold
        self.trackers: list[KalmanBoxTracker] = []
        self.frame_count = 0

    def reset(self):
        self.trackers = []
        self.frame_count = 0
        KalmanBoxTracker.count = 0

    def update(self, detections: np.ndarray) -> list[TrackOutput]:
        """
        detections columns:
        [x1, y1, x2, y2, confidence, class_id]
        """
        self.frame_count += 1

        predicted_boxes = []
        valid_trackers = []

        for tracker in self.trackers:
            prediction = tracker.predict()

            if np.any(np.isnan(prediction)):
                continue

            predicted_boxes.append(
                [
                    prediction[0],
                    prediction[1],
                    prediction[2],
                    prediction[3],
                ]
            )
            valid_trackers.append(tracker)

        self.trackers = valid_trackers

        tracker_array = (
            np.asarray(predicted_boxes, dtype=np.float32)
            if predicted_boxes
            else np.empty((0, 4), dtype=np.float32)
        )

        if len(detections) == 0:
            detections = np.empty((0, 6), dtype=np.float32)

        matches, unmatched_dets, _ = associate_detections_to_trackers(
            detections,
            tracker_array,
            self.iou_threshold,
        )

        for det_index, tracker_index in matches:
            det = detections[det_index]
            self.trackers[tracker_index].update(
                det[:4],
                int(det[5]),
                float(det[4]),
            )

        for det_index in unmatched_dets:
            det = detections[det_index]
            self.trackers.append(
                KalmanBoxTracker(
                    det[:4],
                    int(det[5]),
                    float(det[4]),
                )
            )

        outputs: list[TrackOutput] = []
        alive_trackers = []

        for tracker in self.trackers:
            if tracker.time_since_update <= self.max_age:
                alive_trackers.append(tracker)

            if tracker.time_since_update != 0:
                continue

            if tracker.hit_streak >= self.min_hits or self.frame_count <= self.min_hits:
                outputs.append(
                    TrackOutput(
                        bbox=tracker.get_state(),
                        track_id=tracker.id,
                        class_id=tracker.class_id,
                        confidence=tracker.confidence,
                    )
                )

        self.trackers = alive_trackers
        return outputs
