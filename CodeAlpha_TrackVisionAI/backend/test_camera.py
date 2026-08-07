import sys
import cv2

print("OpenCV:", cv2.__version__)
print("Scanning camera indexes 0-4...\n")

working = []

for index in range(5):
    attempts = []

    if hasattr(cv2, "CAP_AVFOUNDATION"):
        attempts.append(("AVFoundation", cv2.CAP_AVFOUNDATION))

    attempts.append(("Default", cv2.CAP_ANY))

    for name, backend in attempts:
        print(f"Camera {index} / {name}")

        cap = cv2.VideoCapture(index, backend)

        if not cap.isOpened():
            print("  NOT OPENED")
            cap.release()
            continue

        ok, frame = cap.read()

        if ok and frame is not None:
            h, w = frame.shape[:2]
            print(f"  WORKING: {w}x{h}")
            working.append(index)
            cap.release()
            break

        print("  Opened, but no frame received")
        cap.release()

print()

if working:
    print("Working camera indexes:", sorted(set(working)))
    sys.exit(0)

print("No camera could be accessed.")
print("On macOS go to:")
print("System Settings > Privacy & Security > Camera")
print("Enable Terminal / VS Code / PyCharm, whichever is running Python.")
sys.exit(1)
