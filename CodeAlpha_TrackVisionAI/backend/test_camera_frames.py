import time
from pathlib import Path
import cv2

out = Path("camera_test_frames")
out.mkdir(exist_ok=True)

print("Scanning camera indexes 0-5...\n")

for index in range(6):
    found = False
    backends = []

    if hasattr(cv2, "CAP_AVFOUNDATION"):
        backends.append(("AVFoundation", cv2.CAP_AVFOUNDATION))

    backends.append(("Default", cv2.CAP_ANY))

    for backend_name, backend in backends:
        cap = cv2.VideoCapture(index, backend)

        if not cap.isOpened():
            cap.release()
            continue

        # Give macOS camera exposure/white-balance time to initialize.
        frame = None
        for _ in range(25):
            ok, candidate = cap.read()
            if ok and candidate is not None and candidate.size:
                frame = candidate
            time.sleep(0.03)

        cap.release()

        if frame is None:
            continue

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = float(gray.mean())
        variation = float(gray.std())

        path = out / f"camera_{index}_{backend_name}.jpg"
        cv2.imwrite(str(path), frame)

        print(
            f"Camera {index}: {backend_name} | "
            f"{frame.shape[1]}x{frame.shape[0]} | "
            f"brightness={brightness:.1f} | variation={variation:.1f}"
        )
        print(f"  saved -> {path}")

        if brightness < 3 and variation < 3:
            print("  WARNING: this camera is probably returning a black frame")

        print()
        found = True
        break

    if not found:
        print(f"Camera {index}: unavailable\n")

print("Open the camera_test_frames folder.")
print("Use the index whose JPG actually shows your real webcam.")
