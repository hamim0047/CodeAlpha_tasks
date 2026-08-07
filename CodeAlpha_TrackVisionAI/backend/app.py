from __future__ import annotations

import os
import time
import uuid
from pathlib import Path

import cv2
from flask import Flask, Response, jsonify, request
from werkzeug.utils import secure_filename

from vision_engine import VisionEngine

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".mp4",
    ".mov",
    ".avi",
    ".mkv",
    ".webm",
    ".m4v",
}

app = Flask(__name__)

app.config["MAX_CONTENT_LENGTH"] = 500 * 1024 * 1024

engine = VisionEngine(model_name="yolov8n.pt")


def allowed_video(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


@app.get("/api/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "model_ready": True,
            "model_name": engine.model_name,
            "detector": "Ultralytics YOLO",
            "tracker": "SORT",
            "opencv": cv2.__version__,
        }
    )


@app.get("/api/stats")
def stats():
    return jsonify(engine.get_stats())


@app.post("/api/settings")
def settings():
    data = request.get_json(silent=True) or {}

    confidence = data.get("confidence", engine.confidence)
    iou = data.get("iou", engine.iou)

    try:
        engine.set_settings(float(confidence), float(iou))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid confidence or IoU value."}), 400

    return jsonify(
        {
            "ok": True,
            "confidence": engine.confidence,
            "iou": engine.iou,
        }
    )


@app.post("/api/source/webcam")
def webcam():
    camera_index = request.args.get("index", default=0, type=int)

    if not engine.start_webcam(camera_index):
        return (
            jsonify(
                {
                    "error": (
                        "Could not open the webcam. On macOS, allow camera "
                        "access for Terminal/your IDE under System Settings → "
                        "Privacy & Security → Camera."
                    )
                }
            ),
            400,
        )

    return jsonify(
        {
            "ok": True,
            "source_type": "webcam",
            "camera_index": camera_index,
        }
    )


@app.post("/api/source/upload")
def upload_video():
    if "video" not in request.files:
        return jsonify({"error": "No video file was uploaded."}), 400

    file = request.files["video"]

    if not file.filename:
        return jsonify({"error": "The uploaded file has no filename."}), 400

    if not allowed_video(file.filename):
        return (
            jsonify(
                {
                    "error": (
                        "Unsupported video format. Use MP4, MOV, AVI, MKV, "
                        "WEBM, or M4V."
                    )
                }
            ),
            400,
        )

    original_name = secure_filename(file.filename)
    extension = Path(original_name).suffix.lower()

    destination = UPLOAD_DIR / f"{uuid.uuid4().hex}{extension}"
    file.save(destination)

    if not engine.start_video(destination):
        try:
            destination.unlink()
        except OSError:
            pass

        return jsonify({"error": "OpenCV could not open this video."}), 400

    return jsonify(
        {
            "ok": True,
            "source_type": "video",
            "filename": original_name,
        }
    )


@app.post("/api/source/stop")
def stop_source():
    engine.stop()
    return jsonify({"ok": True})


def mjpeg_stream():
    while True:
        frame = engine.read_processed_frame()

        if frame is None:
            if not engine.running:
                break

            time.sleep(0.02)
            continue

        ok, buffer = cv2.imencode(
            ".jpg",
            frame,
            [int(cv2.IMWRITE_JPEG_QUALITY), 82],
        )

        if not ok:
            continue

        payload = buffer.tobytes()

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + payload
            + b"\r\n"
        )


@app.get("/api/stream")
def stream():
    if not engine.running:
        return jsonify({"error": "No active video source."}), 409

    return Response(
        mjpeg_stream(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


@app.errorhandler(413)
def too_large(_error):
    return (
        jsonify(
            {
                "error": "The uploaded video is larger than the 500 MB limit."
            }
        ),
        413,
    )


if __name__ == "__main__":
    try:
        app.run(
            host="127.0.0.1",
            port=5001,
            debug=True,
            threaded=True,
            use_reloader=False,
        )
    finally:
        engine.stop()
