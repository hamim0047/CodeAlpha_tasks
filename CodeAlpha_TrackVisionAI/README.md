# TrackVision AI — Object Detection and Tracking

TrackVision AI is a full-stack computer vision project that performs real-time
object detection and multi-object tracking from a webcam or uploaded video.

It uses a pretrained **YOLO** model for detection, **OpenCV** for video-frame
processing, and a custom **SORT** implementation for persistent tracking IDs.

The React dashboard displays the processed video in real time with:

- Bounding boxes
- Object class labels
- Confidence scores
- Persistent tracking IDs
- FPS
- Detection count
- Active track count
- Per-class object counts

---

## Assignment Requirements Covered

| Requirement | Implementation |
|---|---|
| Real-time video input | OpenCV webcam + uploaded video |
| Pretrained detector | Ultralytics YOLO |
| Process each frame | OpenCV + YOLO inference |
| Bounding boxes | OpenCV drawing |
| Object tracking | SORT |
| Tracking algorithm | Kalman Filter + IoU + Hungarian assignment |
| Labels and IDs | Class + confidence + `#track_id` |
| Real-time display | Flask MJPEG stream + React UI |

---

## Technology Stack

### Frontend

- ReactJS
- Vite
- Tailwind CSS
- Lucide React

### Backend / Computer Vision

- Python
- Flask
- OpenCV
- Ultralytics YOLO
- NumPy
- SciPy
- FilterPy
- SORT

---

## Computer Vision Pipeline

```text
Webcam / Video File
        ↓
OpenCV VideoCapture
        ↓
Read Frame
        ↓
Pretrained YOLO
        ↓
Object Detections
[x1, y1, x2, y2, confidence, class]
        ↓
SORT Tracker
   ├── Kalman Filter
   ├── IoU matching
   └── Hungarian assignment
        ↓
Persistent Tracking IDs
        ↓
OpenCV Annotation
   ├── Bounding Box
   ├── Class Label
   ├── Confidence
   └── Track ID
        ↓
JPEG Encoding
        ↓
Flask MJPEG Stream
        ↓
React Dashboard
```

---

## Example Tracking Label

```text
person  #3  0.91
```

means:

```text
person = detected object class
#3     = persistent SORT tracking ID
0.91   = YOLO confidence score
```

When the same person moves between frames, SORT attempts to preserve the same
tracking ID.

---

## Project Structure

```text
TrackVision_AI/
│
├── backend/
│   ├── uploads/
│   ├── app.py
│   ├── vision_engine.py
│   ├── sort_tracker.py
│   ├── test_image.py
│   └── requirements.txt
│
├── src/
│   ├── components/
│   │   ├── MetricCard.jsx
│   │   ├── ObjectCounts.jsx
│   │   └── PipelineStep.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── index.html
├── vite.config.js
├── package.json
├── .gitignore
└── README.md
```

---

# 1. Frontend Setup

From the project root:

```bash
npm install
```

If required:

```bash
npm install lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

---

# 2. Python Environment

Open the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate on macOS/Linux:

```bash
source .venv/bin/activate
```

Windows:

```text
.venv\Scripts\activate
```

Upgrade pip:

```bash
python -m pip install --upgrade pip setuptools wheel
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# 3. YOLO Model

The project uses:

```text
yolov8n.pt
```

The `n` version is the Nano model.

It is selected because it is lightweight enough for real-time student-project
use on many laptops.

On the first backend startup, Ultralytics may download the pretrained weights
automatically if they are not already cached.

After that, the weights are reused locally.

---

# 4. Start the Backend

Inside `backend`:

```bash
source .venv/bin/activate
python app.py
```

Backend:

```text
http://127.0.0.1:5001
```

Keep this terminal running.

---

# 5. Start the Frontend

Open another terminal in the project root:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 6. Use Webcam

Click:

```text
Webcam
```

The backend opens:

```python
cv2.VideoCapture(0)
```

The webcam frames are:

```text
Captured
→ Detected
→ Tracked
→ Annotated
→ Streamed to React
```

---

## macOS Camera Permission

The first time OpenCV accesses the webcam, macOS may request permission.

If the webcam cannot open:

```text
System Settings
→ Privacy & Security
→ Camera
```

Enable camera access for the application that starts Python, such as:

- Terminal
- iTerm
- VS Code
- PyCharm

Then restart the backend.

---

# 7. Use an Uploaded Video

Click:

```text
Upload Video
```

Supported formats include:

```text
.mp4
.mov
.avi
.mkv
.webm
.m4v
```

Maximum upload size:

```text
500 MB
```

The uploaded video is processed frame by frame using the same YOLO + SORT
pipeline.

---

# 8. Detection Settings

## Confidence Threshold

Controls the minimum YOLO confidence required to keep a detection.

Example:

```text
0.20 → more detections, more possible false positives
0.40 → balanced
0.70 → fewer, stronger detections
```

Recommended:

```text
0.35–0.50
```

---

## YOLO IoU Threshold

Controls non-maximum suppression behavior inside YOLO.

Recommended starting value:

```text
0.45
```

---

# SORT Tracking

SORT stands for:

```text
Simple Online and Realtime Tracking
```

This project implements the core SORT pipeline.

Each detected object's bounding box is passed into the tracker.

SORT uses:

```text
Kalman Filter
+
Intersection over Union (IoU)
+
Hungarian Assignment
```

to connect detections between consecutive frames.

---

## Kalman Filter

The Kalman filter predicts where an existing tracked object is expected to be
in the next frame.

Simplified flow:

```text
Previous Object Position
        ↓
Kalman Prediction
        ↓
Expected New Position
        ↓
Compare With YOLO Detections
        ↓
Kalman Update
```

---

## IoU Matching

IoU measures the overlap between a predicted track box and a new detection.

```text
IoU =
intersection area / union area
```

A larger IoU suggests that the detection and track may represent the same
object.

---

## Hungarian Assignment

When multiple detections and tracks exist, the Hungarian algorithm finds a
good one-to-one assignment using the IoU matching scores.

This allows SORT to manage multiple objects simultaneously.

---

# API

## Health

```http
GET /api/health
```

Example:

```json
{
  "status": "ok",
  "model_ready": true,
  "model_name": "yolov8n.pt",
  "detector": "Ultralytics YOLO",
  "tracker": "SORT"
}
```

---

## Start Webcam

```http
POST /api/source/webcam
```

Optional camera index:

```text
/api/source/webcam?index=1
```

---

## Upload Video

```http
POST /api/source/upload
Content-Type: multipart/form-data
```

Field:

```text
video
```

---

## Stop

```http
POST /api/source/stop
```

---

## Live Stream

```http
GET /api/stream
```

Returns an MJPEG stream.

---

## Statistics

```http
GET /api/stats
```

Example:

```json
{
  "running": true,
  "source_type": "webcam",
  "fps": 14.6,
  "detections": 4,
  "tracks": 3,
  "counts": {
    "person": 2,
    "cell phone": 1
  },
  "frame_width": 1280,
  "frame_height": 720
}
```

---

## Settings

```http
POST /api/settings
Content-Type: application/json
```

Example:

```json
{
  "confidence": 0.4,
  "iou": 0.45
}
```

---

# Test YOLO With a Single Image

You can test the detector separately before using the full application.

Inside `backend`:

```bash
python test_image.py /path/to/image.jpg
```

The script creates:

```text
image_detected.jpg
```

with YOLO bounding boxes.

---

# Full First Run

## Terminal 1 — Backend

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

python app.py
```

---

## Terminal 2 — Frontend

From the project root:

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# Troubleshooting

## `ultralytics` cannot be imported

```bash
pip install ultralytics
```

---

## `cv2` cannot be imported

```bash
pip install opencv-python
```

---

## `filterpy` cannot be imported

```bash
pip install filterpy
```

---

## `scipy` cannot be imported

```bash
pip install scipy
```

---

## Webcam Does Not Open on Mac

Check:

```text
System Settings
→ Privacy & Security
→ Camera
```

Allow your Terminal or IDE.

Then restart:

```bash
python app.py
```

---

## Frontend Says Backend Offline

Make sure Flask is running on:

```text
http://127.0.0.1:5001
```

Check:

```bash
curl http://127.0.0.1:5001/api/health
```

---

## Vite Proxy Error / ECONNREFUSED

This normally means Flask is not running.

Start:

```bash
cd backend
source .venv/bin/activate
python app.py
```

---

## Detection Is Too Slow

Try:

- Use `yolov8n.pt`
- Close other heavy applications
- Reduce webcam resolution
- Increase the confidence threshold
- Use a GPU-supported environment if available

The project already uses the lightweight Nano YOLO model.

---

## IDs Change Too Often

SORT relies mainly on motion and bounding-box overlap.

IDs may change when:

- Objects disappear for too long
- Objects overlap heavily
- The camera moves rapidly
- Detection temporarily fails

For stronger identity preservation, a future version can use Deep SORT or
ByteTrack.

---

# Limitations

- SORT does not use appearance embeddings.
- Tracking IDs can change after long occlusion.
- Performance depends on hardware.
- The pretrained detector only recognizes classes it was trained on.
- Browser MJPEG streaming is convenient but not as efficient as WebRTC.
- Webcam input is local to the machine running Flask.

---

# Possible Improvements

- Deep SORT
- ByteTrack
- YOLO segmentation
- Object counting across a virtual line
- Vehicle counting
- Entry/exit counting
- Track history trails
- Heatmaps
- Region-of-interest detection
- Save processed video
- Export detection CSV
- Event recording
- GPU inference
- WebRTC streaming
- Custom YOLO training

---

# Author

Hamim

---

# Project

**Task 4 — Object Detection and Tracking**

This project demonstrates how OpenCV video processing, a pretrained YOLO
detector, Kalman filtering, IoU matching, Hungarian assignment, and real-time
web visualization can be combined into a complete multi-object tracking
system.
