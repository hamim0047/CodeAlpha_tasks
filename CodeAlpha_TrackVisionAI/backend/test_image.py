from __future__ import annotations

import argparse
from pathlib import Path

import cv2
from ultralytics import YOLO


def main(image_path: str):
    path = Path(image_path)

    if not path.exists():
        raise FileNotFoundError(path)

    image = cv2.imread(str(path))

    if image is None:
        raise RuntimeError("OpenCV could not read the image.")

    model = YOLO("yolov8n.pt")

    result = model.predict(
        image,
        conf=0.40,
        iou=0.45,
        verbose=False,
    )[0]

    annotated = result.plot()

    output = path.with_name(path.stem + "_detected.jpg")
    cv2.imwrite(str(output), annotated)

    print(f"Saved: {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("image")
    args = parser.parse_args()

    main(args.image)
